import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Download, Payment, CreditCard } from '@mui/icons-material';
import QRCode from 'react-qr-code';
import { useInvoice } from '../contexts/InvoiceContext';
import { StatusChip } from '../components/StatusChip';
import paymentsAPI from '../services/paymentsAPI';
import notificationsAPI from '../services/notificationsAPI';

const InvoiceDetails = () => {
  const { id } = useParams();
  const theme = useTheme();
  const { getInvoiceDetails, payInvoiceETH, payInvoiceToken } = useInvoice();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [fiatLoading, setFiatLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const hasRecipientEmail = Boolean(
    invoice?.recipientEmail || invoice?.recipient?.email || invoice?.recipientEmailAddress
  );

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true);
        const invoiceData = await getInvoiceDetails(id);
        setInvoice(invoiceData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadInvoice();
    }
  }, [id, getInvoiceDetails]);

  const handleDownloadPDF = async () => {
    if (invoice?.ipfsHash) {
      try {
        // Download directly from Pinata gateway
  const pinataGateway = process.env.REACT_APP_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
        const directUrl = `${pinataGateway}${invoice.ipfsHash}`;
        
        console.log('Downloading PDF from Pinata:', directUrl);
        
        const response = await fetch(directUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to download from Pinata: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Verify it's a PDF
        if (blob.type !== 'application/pdf' && !blob.type.includes('pdf')) {
          console.warn('Downloaded file type:', blob.type, 'Size:', blob.size);
        }
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${id}.pdf`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('PDF download successful from Pinata');
      } catch (error) {
        console.error('Pinata download failed:', error);
        
        // Fallback to backend API
        try {
          console.log('Trying fallback download via backend...');
          const fallbackResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3002'}/api/ipfs/file/${invoice.ipfsHash}`);
          
          if (!fallbackResponse.ok) {
            throw new Error(`Backend fallback failed: ${fallbackResponse.status}`);
          }
          
          const blob = await fallbackResponse.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${id}.pdf`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          console.log('PDF download successful via backend fallback');
        } catch (fallbackError) {
          console.error('Both Pinata and backend download failed:', fallbackError);
          alert('Failed to download PDF. Please try again later.');
        }
      }
    } else {
      alert('PDF file not available for this invoice.');
    }
  };

  const handlePayInvoice = async () => {
    if (!invoice) return;
    
    try {
      setPaymentLoading(true);
      
      // Convert amount from wei to ETH for payment
      const amountInETH = (parseFloat(invoice.amount) / 1e18).toString();
      
      // Check if it's a token payment or ETH payment
      if (invoice.tokenAddress && invoice.tokenAddress !== '0x0000000000000000000000000000000000000000') {
        await payInvoiceToken(id, invoice.tokenAddress, amountInETH);
      } else {
        await payInvoiceETH(id, amountInETH);
      }
      
      // Reload invoice data to get updated status
      const updatedInvoice = await getInvoiceDetails(id);
      setInvoice(updatedInvoice);
      
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayWithCard = async () => {
    if (!invoice) return;
    try {
      setFiatLoading(true);
      const val = typeof invoice.amount === 'object' ? parseFloat(invoice.amount.toString()) : parseFloat(invoice.amount);
      const isWeiLike = !isNaN(val) && val > 1e12;
      const eth = isWeiLike ? (val / 1e18) : val;
      const approxEthPrice = Number(process.env.REACT_APP_DEMO_ETH_USD || 3000);
      const amountUSD = Math.max(0.5, Number((eth * approxEthPrice).toFixed(2)));
      const session = await paymentsAPI.createCheckoutSession({
        invoiceId: id,
        title: invoice.description || `Invoice ${id}`,
        amountUSD,
        successUrl: `${window.location.origin}/invoice/${id}?fiat=success`,
        cancelUrl: `${window.location.origin}/invoice/${id}?fiat=cancel`,
        metadata: { ipfsHash: invoice.ipfsHash || '' },
      });
      if (session?.url) window.location.href = session.url;
    } catch (e) {
      alert(e.message || 'Failed to start card payment');
    } finally {
      setFiatLoading(false);
    }
  };
  
  const handleEmailInvoice = async () => {
    if (!invoice) return;
    let overrideEmail;
    if (!hasRecipientEmail) {
      overrideEmail = window.prompt('No recipient email on this invoice. Enter an email to send to:');
      if (!overrideEmail || !overrideEmail.includes('@')) {
        alert('Please enter a valid email address.');
        return;
      }
    }
    try {
      setEmailLoading(true);
      await notificationsAPI.sendInvoiceEmail(id, overrideEmail);
      alert('Invoice email sent (Mailgun)');
    } catch (e) {
      alert(e.message || 'Failed to send invoice email');
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="50vh"
        sx={{
          background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' : theme.palette.background.default,
        }}
      >
        <CircularProgress size={60} sx={{ color: theme.palette.text.secondary }} />
      </Box>
    );
  }

  if (error) {
    return (
    <Box 
        sx={{
          minHeight: '100vh',
      background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' : theme.palette.background.default,
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Alert 
          severity="error" 
          sx={{
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#ef4444'
            }
          }}
        >
          Failed to load invoice: {error}
        </Alert>
      </Box>
    );
  }

  if (!invoice) {
    return (
    <Box 
        sx={{
          minHeight: '100vh',
      background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' : theme.palette.background.default,
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Alert 
          severity="warning" 
          sx={{
            bgcolor: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            color: '#fbbf24',
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#fbbf24'
            }
          }}
        >
          Invoice not found
        </Alert>
      </Box>
    );
  }

  return (
  <Box sx={{ minHeight: '100vh', background: 'transparent', p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography 
          variant="h4" 
          sx={{ 
      color: theme.palette.text.primary, 
            fontWeight: 700,
      letterSpacing: '-0.015em'
          }}
        >
          Invoice #{id}
        </Typography>
  <StatusChip status={invoice.status} size="medium" />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card 
            sx={{
              background: theme.palette.mode === 'dark' ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)' : theme.palette.background.paper,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(26px) saturate(120%)',
              WebkitBackdropFilter: 'blur(26px) saturate(120%)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: theme.palette.mode === 'dark' ? 'linear-gradient(90deg, transparent, rgba(148,163,184,0.3), transparent)' : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.12), transparent)',
              }
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 3 }}>
                Invoice Details
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', 
                      backdropFilter: theme.palette.mode === 'dark' ? 'blur(12px) saturate(120%)' : undefined,
                      WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(12px) saturate(120%)' : undefined,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                      Amount
                    </Typography>
                    <Typography variant="h5" sx={{ color: theme.palette.success.main, fontWeight: 700 }}>
                      {(() => {
                        const val = typeof invoice.amount === 'object' ? parseFloat(invoice.amount.toString()) : parseFloat(invoice.amount);
                        const isWeiLike = !isNaN(val) && val > 1e12;
                        const eth = isWeiLike ? (val / 1e18) : val;
                        return `${(eth || 0).toFixed(4)} ETH`;
                      })()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', 
                      backdropFilter: theme.palette.mode === 'dark' ? 'blur(12px) saturate(120%)' : undefined,
                      WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(12px) saturate(120%)' : undefined,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                      Due Date
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', 
                      backdropFilter: theme.palette.mode === 'dark' ? 'blur(12px) saturate(120%)' : undefined,
                      WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(12px) saturate(120%)' : undefined,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                      {invoice.description || 'No description provided'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3, borderColor: theme.palette.divider }} />

              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', 
                      backdropFilter: theme.palette.mode === 'dark' ? 'blur(12px) saturate(120%)' : undefined,
                      WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(12px) saturate(120%)' : undefined,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                      Issuer
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {invoice.issuer}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(0,0,0,0.02)', 
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                      Recipient
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {invoice.recipient}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            sx={{
              background: theme.palette.background.paper,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: theme.palette.mode === 'dark' ? 'linear-gradient(90deg, transparent, rgba(148,163,184,0.3), transparent)' : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.12), transparent)',
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 3 }}>
                Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleDownloadPDF}
                  disabled={!invoice?.ipfsHash}
                  fullWidth
                  sx={{
                    borderColor: invoice?.ipfsHash ? theme.palette.divider : 'rgba(148, 163, 184, 0.1)',
                    color: invoice?.ipfsHash ? theme.palette.text.secondary : 'rgba(148, 163, 184, 0.5)',
                    '&:hover': {
                      borderColor: invoice?.ipfsHash ? theme.palette.text.secondary : 'rgba(148, 163, 184, 0.1)',
                      color: invoice?.ipfsHash ? theme.palette.text.primary : 'rgba(148, 163, 184, 0.5)',
                      bgcolor: invoice?.ipfsHash ? (theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0,0,0,0.04)') : 'transparent'
                    },
                    '&:disabled': {
                      borderColor: 'rgba(148, 163, 184, 0.1)',
                      color: 'rgba(148, 163, 184, 0.5)'
                    },
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  {invoice?.ipfsHash ? 'Download PDF' : 'PDF Not Available'}
                </Button>
                {invoice.status === 0 && /^\d+$/.test(String(id)) && (
                  <Button
                    variant="contained"
                    startIcon={<Payment />}
                    onClick={handlePayInvoice}
                    disabled={paymentLoading}
                    fullWidth
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' ? '#1f2937' : '#111827',
                      color: theme.palette.primary.contrastText,
                      '&:hover': { bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#000000' },
                      '&:disabled': { 
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(31,41,55,0.6)' : 'rgba(0,0,0,0.3)',
                        color: 'rgba(255, 255, 255, 0.7)' 
                      },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    {paymentLoading ? 'Processing Payment...' : 'Pay Invoice'}
                  </Button>
                )}
                {invoice.status === 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<CreditCard />}
                    onClick={handlePayWithCard}
                    disabled={fiatLoading}
                    fullWidth
                    sx={{
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.secondary,
                      '&:hover': { borderColor: theme.palette.text.secondary, color: theme.palette.text.primary, bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.04)' },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    {fiatLoading ? 'Redirecting…' : 'Pay with Card'}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={handleEmailInvoice}
                  disabled={emailLoading || !hasRecipientEmail}
                  fullWidth
                  sx={{
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.secondary,
                    '&:hover': { borderColor: theme.palette.text.secondary, color: theme.palette.text.primary, bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.04)' },
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  {emailLoading ? 'Sending…' : hasRecipientEmail ? 'Email Invoice' : 'No Recipient Email'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card 
            sx={{ 
              mt: 2,
              background: theme.palette.mode === 'dark' ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)' : theme.palette.background.paper,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(26px) saturate(120%)',
              WebkitBackdropFilter: 'blur(26px) saturate(120%)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: theme.palette.mode === 'dark' ? 'linear-gradient(90deg, transparent, rgba(148,163,184,0.3), transparent)' : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.12), transparent)',
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 3 }}>
                QR Code
              </Typography>
              <Box 
                display="flex" 
                justifyContent="center" 
                sx={{
                  p: 2,
                  bgcolor: '#ffffff',
                  borderRadius: 2,
                  border: `2px solid ${theme.palette.divider}`
                }}
              >
                <QRCode
                  value={window.location.href}
                  size={150}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InvoiceDetails;
