import React, { useState, useEffect } from 'react';
import { keyframes } from '@emotion/react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Avatar,
  Fade,
  Container,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Receipt,
  Add,
  TrendingUp,
  AccountBalanceWallet,
  CheckCircle,
  AttachMoney,
  Schedule,
  Visibility,
} from '@mui/icons-material';
import { KPIStat } from '../components/KPIStat';
import { StatusChip } from '../components/StatusChip';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useInvoice } from '../contexts/InvoiceContext';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isConnected, account } = useWallet();
  const { userInvoices, loading, loadUserInvoices } = useInvoice();
  
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    disputed: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    if (isConnected && account) {
      loadUserInvoices();
    }
  }, [isConnected, account, loadUserInvoices]);

  useEffect(() => {
    if (userInvoices.length > 0) {
      const newStats = userInvoices.reduce((acc, invoice) => {
        acc.total += 1;
        
        switch (invoice.status) {
          case 1: // Paid
            acc.paid += 1;
            break;
          case 0: // Created/Pending
            acc.pending += 1;
            break;
          case 2: // Disputed
            acc.disputed += 1;
            break;
          default:
            break;
        }
        
        try {
          const val = typeof invoice.amount === 'object' ? parseFloat(invoice.amount.toString()) : parseFloat(invoice.amount);
          const isWeiLike = !isNaN(val) && val > 1e12; // heuristic
          acc.totalAmount += isWeiLike ? (val / 1e18) : (val || 0);
        } catch {
          // ignore parse errors
        }
        return acc;
      }, {
        total: 0,
        paid: 0,
        pending: 0,
        disputed: 0,
        totalAmount: 0,
      });
      
      setStats(newStats);
    }
  }, [userInvoices]);

  // Replaced legacy StatCard with shared KPIStat component

  if (!isConnected) {
    const darkGradient = 'linear-gradient(135deg, #0a0e27 0%, #1a1d3a 25%, #2d3561 50%, #3b4371 75%, #4a5282 100%)';
    const lightGradient = 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #ffffff 100%)';
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: theme.palette.mode === 'dark' ? darkGradient : lightGradient,
          position: 'relative',
          '&::before': theme.palette.mode === 'dark' ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 20% 80%, rgba(148,163,184, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(148,163,184, 0.06) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(148,163,184, 0.04) 0%, transparent 50%)`,
            pointerEvents: 'none'
          } : undefined,
        }}
      >
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="100vh"
            textAlign="center"
          >
            <Fade in={true} timeout={1000}>
              <Box 
                sx={{
                  background: theme.palette.background.paper,
                  borderRadius: 3,
                  p: 6,
                  mb: 4,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: theme.palette.mode === 'dark' ? '0 25px 50px rgba(0, 0, 0, 0.25)' : '0 10px 30px rgba(0,0,0,0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: `linear-gradient(90deg, transparent, ${theme.palette.divider}, transparent)`,
                  }
                }}
              >
                <Box position="relative" zIndex={2}>
                  <AccountBalanceWallet 
                    sx={{ 
                      fontSize: 80, 
                      color: theme.palette.text.secondary, 
                      mb: 3,
                      filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 4px 20px rgba(148,163,184, 0.3))' : 'drop-shadow(0 4px 20px rgba(0,0,0, 0.15))',
                    }} 
                  />
                  <Typography 
                    variant="h3" 
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      fontSize: { xs: '2rem', md: '2.5rem' },
                      letterSpacing: '-0.025em',
                      mb: 2
                    }}
                  >
                    Connect Your Wallet
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color={theme.palette.text.secondary} 
                    paragraph
                    sx={{
                      fontWeight: 400,
                      lineHeight: 1.6,
                      maxWidth: 500,
                      mx: 'auto'
                    }}
                  >
                    Please connect your wallet to access the blockchain invoicing system and manage your invoices.
                  </Typography>
                </Box>
              </Box>
            </Fade>
          </Box>
        </Container>
      </Box>
    );
  }

  // Animation keyframes (formal subtle)
  const fadeInScale = keyframes`0%{opacity:0;transform:translateY(18px) scale(.965);}100%{opacity:1;transform:translateY(0) scale(1);}`;
  const fadeInUp = keyframes`0%{opacity:0;transform:translateY(14px);}100%{opacity:1;transform:translateY(0);}`;
  const listItemFade = keyframes`0%{opacity:0;transform:translateY(6px);}100%{opacity:1;transform:translateY(0);}`;

  return (
  <Box sx={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
    <Container maxWidth="xl" sx={{ pt: 3, position: 'relative', zIndex: 1 }}>
      {/* Header Section */}
  <Box 
          sx={{
            // Professional narrower header (decoupled from extreme bleed of rest of content)
            ml: { xs: -5, sm: -7, md: -9, lg: -10, xl: -11 },
            mr: { xs: 'auto', md: 'auto' },
            maxWidth: { xs: '100%', xl: 1280 }, // clamp overall width
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)'
              : theme.palette.background.paper,
            borderRadius: 3,
            p: { xs: 2, md: 3 }, // reduced overall padding to lower height
            mb: 3,
            color: theme.palette.text.primary,
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(26px) saturate(120%)',
            WebkitBackdropFilter: 'blur(26px) saturate(120%)',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'dark' ? '0 20px 45px rgba(0,0,0,0.35)' : '0 10px 30px rgba(0,0,0,0.08)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(90deg, transparent, rgba(148,163,184,0.35), transparent)'
                : `linear-gradient(90deg, transparent, ${theme.palette.divider}, transparent)`
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: theme.palette.mode === 'dark'
                ? 'radial-gradient(circle at 85% 25%, rgba(148,163,184,0.10) 0%, transparent 60%)'
                : 'radial-gradient(circle at 85% 25%, rgba(0,0,0,0.04) 0%, transparent 60%)',
              pointerEvents: 'none'
            },
            opacity: 0,
            animation: `${fadeInScale} .7s cubic-bezier(.16,.8,.24,1) forwards`
          }}
        >
          <Box 
            display="flex" 
            flexDirection={{ xs: 'column', md: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', md: 'center' }} 
            gap={3}
            position="relative" 
            zIndex={1}
          >
            <Box maxWidth={720} pr={{ md: 2 }}>
              <Typography 
                variant="h2" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  mb: 1.2, // slightly tighter
                  color: theme.palette.mode === 'dark' ? '#f8fafc' : theme.palette.text.primary,
                  fontSize: { xs: '1.85rem', md: '2.3rem' }, // slightly smaller
                  letterSpacing: '-0.03em',
                  lineHeight: 1.12, // reduced line height
                  textWrap: 'balance'
                }}
              >
                Welcome back! 👋
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                  lineHeight: 1.4, // slightly tighter
                  fontSize: { xs: '0.92rem', md: '1.02rem' },
                  maxWidth: 600
                }}
              >
                Manage your blockchain invoices with style ✨ — create, track and analyze invoices seamlessly on-chain.
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="flex-start" flexShrink={0}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/create')}
                size="large"
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? 'white' : theme.palette.primary.main,
                  color: theme.palette.mode === 'dark' ? '#0f172a' : theme.palette.primary.contrastText,
                  borderRadius: 2.5,
                  px: 3.25,
                  py: 1.3, // reduced vertical padding
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: theme.palette.mode === 'dark' ? '0 10px 28px rgba(255,255,255,0.25)' : '0 8px 20px rgba(0,0,0,0.12)',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#f1f5f9' : theme.palette.primary.light,
                    transform: 'translateY(-2px)',
                    boxShadow: theme.palette.mode === 'dark' ? '0 14px 34px rgba(255,255,255,0.35)' : '0 12px 28px rgba(0,0,0,0.18)',
                  },
                  transition: 'all 0.35s cubic-bezier(.16,.8,.24,1)'
                }}
              >
                Create Invoice
              </Button>
            </Box>
          </Box>
  </Box>

  {/* Statistics Cards */}
  <Grid
    container
    spacing={0.75}
    mb={4}
    alignItems="stretch"
    sx={{
      mt: -0.5,
      ml: { xs: -11, sm: -14, md: -17, lg: -20, xl: -22 }, // even more left bleed
      width: {
        xs: 'calc(100% + 88px)',  // 11 * 8
        sm: 'calc(100% + 112px)', // 14 * 8
        md: 'calc(100% + 136px)', // 17 * 8
        lg: 'calc(100% + 160px)', // 20 * 8
        xl: 'calc(100% + 176px)'  // 22 * 8
      },
      pr: 0,
      overflow: 'hidden'
    }}
  >
        {[{
          icon: <Receipt />, label: 'Total Invoices', value: stats.total, color: 'primary'
        }, {
          icon: <CheckCircle />, label: 'Paid', value: stats.paid, color: 'success', delta: stats.total > 0 ? (stats.paid / stats.total) * 100 : 0
        }, {
          icon: <Schedule />, label: 'Pending', value: stats.pending, color: 'warning', delta: stats.total > 0 ? (stats.pending / stats.total) * 100 : 0
        }, {
          icon: <AttachMoney />, label: 'Total Earned (ETH)', value: stats.totalAmount.toFixed(3), color: 'info'
        }].map((card, i) => (
          <Grid key={card.label} item xs={12} sm={6} md={3} sx={{ display: 'flex', opacity: 0, animation: `${fadeInUp} .55s ease forwards`, animationDelay: `${0.12 * i + 0.15}s` }}>
            <KPIStat {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Main Cards Row: Recent Invoices / Quick Actions / Account Summary */}
  <Grid container spacing={2.5} alignItems="stretch" sx={{ mb: 4, ml: { xs: -12, sm: -16, md: -20, lg: -22, xl: -24 }, width: { xs: 'calc(100% + 96px)', sm: 'calc(100% + 128px)', md: 'calc(100% + 160px)', lg: 'calc(100% + 176px)', xl: 'calc(100% + 192px)' } }}> {/* maximized left bleed; very tight gap */}
        {/* Recent Invoices */}
  <Grid item xs={12} md={5} sx={{ display: 'flex' }}> {/* adjusted to free space for wider Account Summary */}
          <Card
              sx={{
                borderRadius: 3,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)'
                  : theme.palette.background.paper,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 25px 50px rgba(0, 0, 0, 0.35)'
                  : '0 8px 24px rgba(0,0,0,0.08)',
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.3s ease-in-out',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(26px) saturate(120%)',
                WebkitBackdropFilter: 'blur(26px) saturate(120%)',
                height: { md: 340 },
                '&:hover': {
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 35px 70px rgba(59, 130, 246, 0.15)'
                    : '0 16px 40px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, transparent, rgba(148,163,184,0.35), transparent)'
                    : `linear-gradient(90deg, transparent, ${theme.palette.divider}, transparent)`,
                },
                opacity: 0,
                animation: `${fadeInScale} .7s cubic-bezier(.16,.8,.24,1) forwards`,
                animationDelay: '0.55s',
                display: 'flex',
                flexDirection: 'column',
                flex: 1
              }}
            >
              <CardContent sx={{ p: 2.25, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Avatar 
                      sx={{ 
                        background: theme.palette.mode === 'dark'
                          ? 'rgba(148,163,184,0.14)'
                          : theme.palette.action.hover,
                        mr: 2, 
                        width: 40, 
                        height: 40,
                        boxShadow: theme.palette.mode === 'dark' ? '0 8px 25px rgba(148,163,184, 0.20)' : '0 2px 6px rgba(0,0,0,0.12)',
                        border: `1px solid ${theme.palette.divider}`,
                        color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : theme.palette.text.secondary
                      }}
                    >
                      <Receipt />
                    </Avatar>
                    <Typography 
                      variant="h5" 
                      component="h2" 
                      sx={{ 
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        fontSize: { xs: '1.25rem', md: '1.5rem' }
                      }}
                    >
                      Recent Invoices
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => navigate('/invoices')}
                    sx={{ 
                      borderRadius: 2,
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.5)' : theme.palette.divider,
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.8)' : theme.palette.text.primary,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.10)' : theme.palette.action.hover,
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    View All
                  </Button>
                </Box>
              
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : userInvoices.length === 0 ? (
                <Alert
                  severity="info"
                  sx={{
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.10)' : theme.palette.action.hover,
                    border: `1px solid ${theme.palette.divider}`,
                    color: theme.palette.text.secondary,
                    '& .MuiAlert-icon': { color: theme.palette.text.secondary }
                  }}
                >
                  No invoices found. Create your first invoice to get started!
                </Alert>
              ) : (
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          pr: 0.5,
          ...(theme.palette.mode === 'dark'
            ? {
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(148,163,184,0.38) transparent', // Firefox
                '&::-webkit-scrollbar': { width: 10, height: 10 },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'linear-gradient(180deg, rgba(148,163,184,0.50) 0%, rgba(148,163,184,0.28) 100%)',
                  borderRadius: 10,
                  border: '1px solid rgba(15,23,42,0.6)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)'
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'linear-gradient(180deg, rgba(148,163,184,0.65) 0%, rgba(148,163,184,0.4) 100%)'
                }
              }
            : {})
        }}>
          <List sx={{ bgcolor: 'transparent', pt: 0 }}>
      {userInvoices.slice(0, 5).map((invoice, idx) => ( // restored count for original height
                    <ListItem
            key={invoice.id || invoice.invoiceId || invoice._id}
                      button
            onClick={() => navigate(`/invoice/${invoice.id || invoice.invoiceId}`)}
                      divider
                      sx={{
                        borderColor: 'rgba(148, 163, 184, 0.2)',
                        opacity: 0,
                        animation: `${listItemFade} .5s ease forwards`,
                        animationDelay: `${0.05 * idx + 0.9}s`,
                        '&:hover': {
                          bgcolor: 'rgba(148, 163, 184, 0.10)',
                        },
                        '&.MuiListItem-button': {
                          borderRadius: 2,
                          mb: 1,
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                              Invoice #{invoice.id || invoice.invoiceId}
                            </Typography>
                            <StatusChip status={invoice.status} size="small" />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              {(() => {
                                const val = typeof invoice.amount === 'object' ? parseFloat(invoice.amount.toString()) : parseFloat(invoice.amount);
                                const isWeiLike = !isNaN(val) && val > 1e12; // heuristic
                                const eth = isWeiLike ? (val / 1e18) : val;
                                return (
                                  <span>
                                    Amount: <span style={{ color: theme.palette.success.main, fontWeight: 600 }}>{(eth || 0).toFixed(4)} ETH</span>
                                  </span>
                                );
                              })()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              Due: {new Date(invoice.dueDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  ))}
          </List>
        </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

    {/* Quick Actions */}
  <Grid item xs={12} md={3} sx={{ display: 'flex' }}> {/* Quick Actions height matches siblings */}
          <Card
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)'
                  : theme.palette.background.paper,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.palette.mode === 'dark' ? '0 25px 50px rgba(0,0,0,0.25)' : '0 8px 24px rgba(0,0,0,0.08)',
                backdropFilter: 'blur(26px) saturate(120%)',
                WebkitBackdropFilter: 'blur(26px) saturate(120%)',
                position: 'relative',
                  height: { md: 340 },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, transparent, rgba(148,163,184,0.35), transparent)'
                    : `linear-gradient(90deg, transparent, ${theme.palette.divider}, transparent)`
                },
                opacity: 0,
                animation: `${fadeInScale} .7s cubic-bezier(.16,.8,.24,1) forwards`,
                animationDelay: '0.65s',
                display: 'flex',
                flexDirection: 'column',
                flex: 1, // stretch to match neighboring card heights
              }}
            >
              <CardContent sx={{ p: 2.25, pb: 2.5, display: 'flex', flexDirection: 'column', flex: 1 }}> {/* compact height */}
                <Typography variant="h6" component="h2" sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 1.25 }}>
                  Quick Actions
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                  Common tasks at a glance.
                </Typography>
                <Box display="flex" flexDirection="column" gap={1.5}> {/* action buttons */}
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Add />}
                    onClick={() => navigate('/create')}
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(203,213,225,0.12)' : theme.palette.primary.main,
                      '&:hover': { 
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(203,213,225,0.2)' : theme.palette.primary.dark,
                        transform: 'translateY(-1px)',
                        boxShadow: theme.palette.mode === 'dark' ? '0 8px 25px rgba(148,163,184,0.25)' : '0 6px 18px rgba(0,0,0,0.15)'
                      },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5,
                      transition: 'all 0.3s ease',
                      color: theme.palette.mode === 'dark' ? theme.palette.text.primary : undefined
                    }}
                  >
                    Create New Invoice
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Receipt />}
                    onClick={() => navigate('/invoices')}
                    sx={{
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.7)' : theme.palette.text.primary,
                        color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.primary,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.10)' : theme.palette.action.hover,
                        transform: 'translateY(-1px)'
                      },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    View All Invoices
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TrendingUp />}
                    onClick={() => navigate('/analytics')}
                    sx={{
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.7)' : theme.palette.text.primary,
                        color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.text.primary,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.10)' : theme.palette.action.hover,
                        transform: 'translateY(-1px)'
                      },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    View Analytics
                  </Button>
                </Box>
                <Box sx={{ flexGrow: 1 }} /> {/* spacer keeps actions top-aligned while filling height */}
              </CardContent>
          </Card>
        </Grid>

        {/* Account Summary */}
  <Grid item xs={12} md={4} sx={{ display: 'flex' }}> {/* widened Account Summary card */}
          <Card
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)'
                  : theme.palette.background.paper,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.palette.mode === 'dark' ? '0 25px 50px rgba(0,0,0,0.25)' : '0 8px 24px rgba(0,0,0,0.08)',
                backdropFilter: 'blur(26px) saturate(120%)',
                WebkitBackdropFilter: 'blur(26px) saturate(120%)',
                position: 'relative',
                flex: 1,
                  height: { md: 340 },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, transparent, rgba(148,163,184,0.35), transparent)'
                    : `linear-gradient(90deg, transparent, ${theme.palette.divider}, transparent)`
                },
                opacity: 0,
                animation: `${fadeInScale} .7s cubic-bezier(.16,.8,.24,1) forwards`,
                animationDelay: '0.75s',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CardContent sx={{ p: 2.25 }}> {/* compact padding */}
                <Typography variant="h6" component="h2" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 3 }}>
                  Account Summary
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}> {/* restored gaps */}
                  <Box>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                      Connected Address
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
            color: theme.palette.text.primary, 
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        wordBreak: 'break-all',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.80)' : theme.palette.action.hover,
                        p: 1.5,
                        borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      {account}
                    </Typography>
                  </Box>
                  
          <Divider sx={{ borderColor: theme.palette.divider, my: 1 }} />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Total Invoices
                    </Typography>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                      {stats.total}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Success Rate
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: stats.total > 0 && stats.paid > 0 ? theme.palette.success.main : theme.palette.text.secondary, 
                        fontWeight: 600 
                      }}
                    >
                      {stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Total Earned
                    </Typography>
          <Typography variant="h6" sx={{ color: theme.palette.warning.main, fontWeight: 600 }}>
                      {stats.totalAmount.toFixed(3)} ETH
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
    </Box>
  );
};

export default Dashboard;
