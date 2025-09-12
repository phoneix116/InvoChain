import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from '@mui/material';
import { Receipt, Send } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

import { useWallet } from '../contexts/WalletContext';
import { useInvoice } from '../contexts/InvoiceContext';
import invoiceAPI from '../services/invoiceAPI';

const steps = ['Invoice Details', 'Preview & Submit'];

const CreateInvoice = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isConnected, account } = useWallet();
  const { createInvoice, loading } = useInvoice();

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    recipientName: '',
    recipientEmail: '',
    recipientAddress: '',
    amount: '',
    tokenAddress: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });
  const [errors, setErrors] = useState({});
  const [pdfBlob, setPdfBlob] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      }
      if (!formData.recipientName.trim()) {
        newErrors.recipientName = 'Recipient name is required';
      }
      if (!formData.recipientAddress.trim()) {
        newErrors.recipientAddress = 'Recipient address is required';
      } else if (!ethers.utils.isAddress(formData.recipientAddress)) {
        newErrors.recipientAddress = 'Invalid Ethereum address';
      } else if (formData.recipientAddress.toLowerCase() === account?.toLowerCase()) {
        newErrors.recipientAddress = 'Cannot create invoice for yourself';
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
      if (formData.dueDate < new Date()) {
        newErrors.dueDate = 'Due date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePDFPreview = async () => {
    if (!validateStep(0)) return;

    try {
      setGeneratingPDF(true);
      
      // Structure the data for PDF preview
      const pdfData = {
        title: formData.title,
        description: formData.description,
        amount: formData.amount,
        dueDate: formData.dueDate,
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail || '',
        recipientAddress: formData.recipientAddress,
      };
      
      const blob = await invoiceAPI.previewInvoicePDF(pdfData);
      setPdfBlob(blob);
      setActiveStep(1);
    } catch (error) {
      console.error('Failed to generate PDF preview:', error);
      toast.error('Failed to generate PDF preview');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      generatePDFPreview();
    } else if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      // The InvoiceContext's createInvoice function expects a 'recipient' field
      // with the wallet address for the blockchain transaction.
      const apiData = {
        title: formData.title,
        description: formData.description,
        amount: formData.amount,
        dueDate: formData.dueDate,
        tokenAddress: formData.tokenAddress,
        recipient: formData.recipientAddress, // Use 'recipient' for the address
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail || '',
      };

      // Call the InvoiceContext's createInvoice function which handles both MongoDB and blockchain
      const result = await createInvoice(apiData);
      
      // Handle partial success (metadata created but PDF failed)
      if (result && !result.success && result.invoice) {
        toast.warning(
          <div>
            <div>Invoice metadata created, but PDF upload failed</div>
            <div>Invoice ID: {result.invoice.invoiceId}</div>
            <div>Error: {result.error}</div>
          </div>
        );
        
        // Navigate to dashboard instead of invoice details since PDF isn't available
        navigate('/dashboard');
        return;
      }
      
      // Handle full success
  if (result && result.invoiceId) {
        toast.success(
          <div>
            <div>Invoice created successfully!</div>
            <div>Invoice ID: {result.invoiceId}</div>
    {result.ipfsHash && <div>PDF stored on IPFS: {result.ipfsHash}</div>}
    {result.storage && <div>Storage: {result.storage}</div>}
          </div>
        );
        
        navigate(`/invoice/${result.invoiceId}`);
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
      toast.error('Failed to create invoice: ' + error.message);
    }
  };

  if (!isConnected) {
    return (
      <Box 
        textAlign="center" 
        mt={4}
        sx={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Alert 
          severity="warning"
          sx={{
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(253, 230, 138, 0.4)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(217, 119, 6, 0.3)'}`,
            color: theme.palette.warning.main,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: theme.palette.warning.main
            }
          }}
        >
          Please connect your wallet to create an invoice.
        </Alert>
      </Box>
    );
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Invoice Title"
                value={formData.title}
                onChange={handleInputChange('title')}
                error={!!errors.title}
                helperText={errors.title}
                placeholder="e.g., Web Development Services"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : theme.palette.background.paper,
                    backdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    '& fieldset': { borderColor: theme.palette.divider },
                    '&:hover fieldset': { borderColor: theme.palette.primary.light },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                    '&.Mui-focused': { color: theme.palette.primary.main },
                  },
                  '& .MuiOutlinedInput-input': { color: theme.palette.text.primary },
                  '& .MuiFormHelperText-root': { color: theme.palette.error.main },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange('description')}
                placeholder="Brief description of services or products"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : theme.palette.background.paper,
                    backdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    '& fieldset': { borderColor: theme.palette.divider },
                    '&:hover fieldset': { borderColor: theme.palette.primary.light },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                    '&.Mui-focused': { color: theme.palette.primary.main },
                  },
                  '& .MuiOutlinedInput-input': { color: theme.palette.text.primary },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Recipient Name"
                value={formData.recipientName}
                onChange={handleInputChange('recipientName')}
                error={!!errors.recipientName}
                helperText={errors.recipientName}
                placeholder="e.g., John Doe"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : theme.palette.background.paper,
                    backdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    '& fieldset': { borderColor: theme.palette.divider },
                    '&:hover fieldset': { borderColor: theme.palette.primary.light },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                    '&.Mui-focused': { color: theme.palette.primary.main },
                  },
                  '& .MuiOutlinedInput-input': { color: theme.palette.text.primary },
                  '& .MuiFormHelperText-root': { color: theme.palette.error.main },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Recipient Email (Optional)"
                type="email"
                value={formData.recipientEmail}
                onChange={handleInputChange('recipientEmail')}
                placeholder="recipient@example.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : theme.palette.background.paper,
                    backdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    '& fieldset': { borderColor: theme.palette.divider },
                    '&:hover fieldset': { borderColor: theme.palette.primary.light },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                    '&.Mui-focused': { color: theme.palette.primary.main },
                  },
                  '& .MuiOutlinedInput-input': { color: theme.palette.text.primary },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Recipient Wallet Address"
                value={formData.recipientAddress}
                onChange={handleInputChange('recipientAddress')}
                error={!!errors.recipientAddress}
                helperText={errors.recipientAddress}
                placeholder="0x..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : theme.palette.background.paper,
                    backdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    '& fieldset': { borderColor: theme.palette.divider },
                    '&:hover fieldset': { borderColor: theme.palette.primary.light },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                    '&.Mui-focused': { color: theme.palette.primary.main },
                  },
                  '& .MuiOutlinedInput-input': { color: theme.palette.text.primary, fontFamily: 'monospace' },
                  '& .MuiFormHelperText-root': { color: theme.palette.error.main },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount (ETH)"
                type="number"
                value={formData.amount}
                onChange={handleInputChange('amount')}
                error={!!errors.amount}
                helperText={errors.amount}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : theme.palette.background.paper,
                    backdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    '& fieldset': { borderColor: theme.palette.divider },
                    '&:hover fieldset': { borderColor: theme.palette.primary.light },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                    '&.Mui-focused': { color: theme.palette.primary.main },
                  },
                  '& .MuiOutlinedInput-input': { color: theme.palette.text.primary },
                  '& .MuiFormHelperText-root': { color: theme.palette.error.main },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Due Date"
                type="date"
                fullWidth
                value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setFormData(prev => ({ ...prev, dueDate: date }));
                  setErrors(prev => ({ ...prev, dueDate: null }));
                }}
                error={!!errors.dueDate}
                helperText={errors.dueDate}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.035) 100%)'
                      : theme.palette.background.paper,
                    backdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    '& fieldset': { borderColor: theme.palette.divider },
                    '&:hover fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.6)' : theme.palette.primary.light },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.9)' : theme.palette.primary.main },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                    '&.Mui-focused': { color: theme.palette.primary.main },
                  },
                  '& .MuiOutlinedInput-input': { color: theme.palette.text.primary },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Token Address (Optional)"
                value={formData.tokenAddress}
                onChange={handleInputChange('tokenAddress')}
                placeholder="Leave empty for ETH payments"
                helperText="Enter ERC20 token address for token payments"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.035) 100%)'
                      : theme.palette.background.paper,
                    backdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(14px) saturate(120%)' : undefined,
                    '& fieldset': { borderColor: theme.palette.divider },
                    '&:hover fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.6)' : theme.palette.primary.light },
                    '&.Mui-focused fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.9)' : theme.palette.primary.main },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                    '&.Mui-focused': { color: theme.palette.primary.main },
                  },
                  '& .MuiOutlinedInput-input': { color: theme.palette.text.primary, fontFamily: 'monospace' },
                  '& .MuiFormHelperText-root': { color: theme.palette.text.secondary },
                }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 3 }}>
              Review Invoice Details & PDF Preview
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 2 }}>
                  Invoice Details
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                    Title
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                    {formData.title}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                    Recipient Name
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                    {formData.recipientName}
                  </Typography>
                </Box>

                {formData.recipientEmail && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                      Recipient Email
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                      {formData.recipientEmail}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                    Recipient Address
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontFamily: 'monospace' }}>
                    {formData.recipientAddress}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                    Amount
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                    {formData.amount} ETH
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                    Due Date
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                    {new Date(formData.dueDate).toLocaleDateString()}
                  </Typography>
                </Box>

                {formData.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                      {formData.description}
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 2 }}>
                  PDF Preview
                </Typography>
                
                {pdfBlob ? (
                  <Box>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.8)' : theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        textAlign: 'center'
                      }}
                    >
                      <Receipt sx={{ fontSize: 48, color: theme.palette.success.main, mb: 1 }} />
                      <Typography variant="body1" sx={{ color: theme.palette.text.primary, mb: 2 }}>
                        PDF Generated Successfully
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                        Size: {(pdfBlob.size / 1024).toFixed(1)} KB
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          const url = URL.createObjectURL(pdfBlob);
                          window.open(url, '_blank');
                          URL.revokeObjectURL(url);
                        }}
                        sx={{
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                          '&:hover': {
                            borderColor: theme.palette.primary.dark,
                            bgcolor: theme.palette.action.hover
                          }
                        }}
                      >
                        Preview PDF
                      </Button>
                    </Paper>
                  </Box>
                ) : (
                  <Alert
                    severity="info"
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.12)' : theme.palette.action.hover,
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.25)' : theme.palette.primary.light}`,
                      color: theme.palette.primary.main,
                      '& .MuiAlert-icon': {
                        color: theme.palette.primary.main
                      }
                    }}
                  >
                    PDF will be generated automatically when you proceed to the next step.
                  </Alert>
                )}
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };


  return (
  <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, p: { xs: 2, md: 3 } }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          color: theme.palette.text.primary, 
          fontWeight: 700,
            mb: 4,
          textAlign: 'left',
          width: '100%',
          ml: { xs: 7, sm: 9, md: 31 }, // increased right shift
        }}
      >
        Create New Invoice
      </Typography>

      <Card 
        sx={{
          maxWidth: 880, // increased width slightly
          width: '100%',
          mx: 'auto',
          transform: { xs: 'translateX(-22px)', sm: 'translateX(-36px)', md: 'translateX(-50px)' }, // slightly more left shift
          transition: 'transform .3s ease',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)'
            : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.9) 100%)',
          borderRadius: 3,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(203, 213, 225, 0.6)'}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 25px 50px rgba(0,0,0,0.35)'
            : '0 10px 30px rgba(0,0,0,0.08)',
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
            background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stepper 
            activeStep={activeStep} 
            sx={{ 
              mb: 4,
              '& .MuiStepLabel-label': {
                color: theme.palette.text.secondary,
                '&.Mui-active': {
                  color: theme.palette.primary.main
                },
                '&.Mui-completed': {
                  color: theme.palette.success.main
                }
              },
              '& .MuiStepIcon-root': {
                color: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.5)' : theme.palette.action.disabled,
                '&.Mui-active': {
                  color: theme.palette.primary.main
                },
                '&.Mui-completed': {
                  color: theme.palette.success.main
                }
              }
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Divider sx={{ my: 3, borderColor: theme.palette.divider }} />

          <Box display="flex" justifyContent="space-between">
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: theme.palette.action.hover
                },
                '&:disabled': {
                  color: theme.palette.action.disabled
                }
              }}
            >
              Back
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  '&:hover': { bgcolor: theme.palette.primary.dark },
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                {loading ? 'Creating...' : 'Create Invoice'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={generatingPDF}
                startIcon={generatingPDF ? <CircularProgress size={20} /> : <Receipt />}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  '&:hover': { bgcolor: theme.palette.primary.dark },
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                {generatingPDF ? 'Generating PDF...' : 'Generate PDF & Continue'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateInvoice;
