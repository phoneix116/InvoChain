import React, { useState, useEffect } from 'react';
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
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Avatar,
  Fade,
  Grow,
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
  AutoGraph,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useInvoice } from '../contexts/InvoiceContext';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isConnected, account } = useWallet();
  const { userInvoices, loading, loadUserInvoices, formatInvoiceStatus, getStatusColor } = useInvoice();
  
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

  const StatCard = ({ title, value, icon, color = 'primary', progress, trend }) => (
    <Grow in={true} timeout={800}>
      <Card 
        sx={{ 
          height: '100%',
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.palette.mode === 'dark' ? '0 10px 25px rgba(0,0,0,0.3)' : '0 10px 25px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: theme.palette.mode === 'dark' ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.15)',
            borderColor: theme.palette.text.secondary,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${theme.palette.text.secondary}, transparent)`,
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {title}
            </Typography>
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.15)' : 'rgba(0,0,0,0.05)', 
                backdropFilter: 'blur(10px)',
                width: 48, 
                height: 48,
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.secondary,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.25)' : 'rgba(0,0,0,0.08)',
                }
              }}
            >
              {icon}
            </Avatar>
          </Box>
          
          <Typography 
            variant="h3" 
            component="div" 
            sx={{ 
              fontWeight: 700, 
              mb: 2,
              color: theme.palette.text.primary,
              fontSize: { xs: '1.75rem', md: '2.25rem' }
            }}
          >
            {value}
          </Typography>
          
          {progress !== undefined && (
            <Box mt={2}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(0,0,0,0.08)',
                  '& .MuiLinearProgress-bar': {
                    background: theme.palette.mode === 'dark' ? 'linear-gradient(90deg, #374151 0%, #6b7280 100%)' : 'linear-gradient(90deg, #111827 0%, #374151 100%)',
                    borderRadius: 3,
                    boxShadow: theme.palette.mode === 'dark' ? '0 0 10px rgba(148,163,184,0.3)' : '0 0 10px rgba(0,0,0,0.15)',
                  }
                }} 
              />
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 1, display: 'block', fontWeight: 500 }}>
                {progress.toFixed(1)}% completion
              </Typography>
            </Box>
          )}
          
          {trend && (
            <Box display="flex" alignItems="center" mt={2} 
                 sx={{ 
                   p: 1.5, 
                   borderRadius: 2, 
                   bgcolor: theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(0,0,0,0.02)', 
                   backdropFilter: 'blur(10px)',
                   border: `1px solid ${theme.palette.divider}`
                 }}>
              <AutoGraph sx={{ fontSize: 16, mr: 1, color: theme.palette.text.secondary }} />
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                {trend}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Grow>
  );

  if (!isConnected) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #0a0e27 0%, #1a1d3a 25%, #2d3561 50%, #3b4371 75%, #4a5282 100%)' : theme.palette.background.default,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.palette.mode === 'dark' ? `
              radial-gradient(circle at 20% 80%, rgba(148,163,184, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(148,163,184, 0.06) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(148,163,184, 0.04) 0%, transparent 50%)
            ` : 'none',
            pointerEvents: 'none',
          }
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
                  boxShadow: theme.palette.mode === 'dark' ? '0 25px 50px rgba(0, 0, 0, 0.25)' : '0 25px 50px rgba(0, 0, 0, 0.1)',
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

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' : theme.palette.background.default,
        position: 'relative',
      }}
    >
    <Container maxWidth="xl" sx={{ pt: 3, position: 'relative', zIndex: 1 }}>
      {/* Header Section */}
      <Fade in={true} timeout={600}>
        <Box 
          sx={{
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            borderRadius: 3,
            p: 4,
            mb: 4,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              right: -50,
              width: 100,
              height: 100,
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              opacity: 0.6,
            }
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
            <Box>
              <Typography 
                variant="h2" 
                component="h1" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 2,
                  color: '#f8fafc',
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  letterSpacing: '-0.025em',
                }}
              >
                Welcome back! �
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#94a3b8',
                  fontWeight: 400,
                  lineHeight: 1.6
                }}
              >
                Manage your blockchain invoices with style ✨
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/create')}
              size="large"
              sx={{
                backgroundColor: 'white',
                color: '#0f172a',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 8px 25px rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  backgroundColor: '#f8fafc',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 30px rgba(255, 255, 255, 0.4)',
                },
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            >
              Create Invoice
            </Button>
          </Box>
        </Box>
      </Fade>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Invoices"
            value={stats.total}
            icon={<Receipt />}
            color="primary"
            progress={stats.total > 0 ? 100 : 0}
            trend={`${stats.total} invoices created`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Paid"
            value={stats.paid}
            icon={<CheckCircle />}
            color="success"
            progress={stats.total > 0 ? (stats.paid / stats.total) * 100 : 0}
            trend={`${stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(1) : 0}% completion rate`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<Schedule />}
            color="warning"
            progress={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}
            trend={`${stats.pending} awaiting payment`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Earned"
            value={`${stats.totalAmount.toFixed(3)} ETH`}
            icon={<AttachMoney />}
            color="info"
            trend={`≈ $${(stats.totalAmount * 2000).toFixed(2)} USD`}
          />
        </Grid>
      </Grid>

      {/* Recent Activity & Quick Actions */}
      <Grid container spacing={3}>
        {/* Recent Invoices */}
        <Grid item xs={12} md={8}>
          <Fade in={true} timeout={1000}>
            <Card 
              sx={{ 
                borderRadius: 3,
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                transition: 'all 0.3s ease-in-out',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(20px)',
                '&:hover': {
                  boxShadow: '0 35px 70px rgba(59, 130, 246, 0.15)',
                  transform: 'translateY(-2px)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Box display="flex" alignItems="center">
                    <Avatar 
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                        mr: 2, 
                        width: 48, 
                        height: 48,
                        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#3b82f6'
                      }}
                    >
                      <Receipt />
                    </Avatar>
                    <Typography 
                      variant="h5" 
                      component="h2" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#f8fafc',
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
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      color: '#3b82f6',
                      '&:hover': {
                        borderColor: '#3b82f6',
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                        transform: 'scale(1.05)',
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
                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    color: '#3b82f6',
                    '& .MuiAlert-icon': {
                      color: '#3b82f6'
                    }
                  }}
                >
                  No invoices found. Create your first invoice to get started!
                </Alert>
              ) : (
                <List sx={{ bgcolor: 'transparent' }}>
          {userInvoices.slice(0, 5).map((invoice) => (
                    <ListItem
            key={invoice.id || invoice.invoiceId || invoice._id}
                      button
            onClick={() => navigate(`/invoice/${invoice.id || invoice.invoiceId}`)}
                      divider
                      sx={{
                        borderColor: 'rgba(148, 163, 184, 0.2)',
                        '&:hover': {
                          bgcolor: 'rgba(59, 130, 246, 0.1)',
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
                            <Typography variant="subtitle1" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                              Invoice #{invoice.id || invoice.invoiceId}
                            </Typography>
                            <Chip
                              label={formatInvoiceStatus(invoice.status)}
                              color={getStatusColor(invoice.status)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              {(() => {
                                const val = typeof invoice.amount === 'object' ? parseFloat(invoice.amount.toString()) : parseFloat(invoice.amount);
                                const isWeiLike = !isNaN(val) && val > 1e12; // heuristic
                                const eth = isWeiLike ? (val / 1e18) : val;
                                return (
                                  <span>
                                    Amount: <span style={{ color: '#22c55e', fontWeight: 600 }}>{(eth || 0).toFixed(4)} ETH</span>
                                  </span>
                                );
                              })()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              Due: {new Date(invoice.dueDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
          </Fade>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Box display="flex" flexDirection="column" gap={3} height="100%">
            <Card 
              sx={{
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                borderRadius: 3,
                border: '1px solid rgba(148, 163, 184, 0.2)',
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
                  background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" component="h2" gutterBottom sx={{ color: '#f8fafc', fontWeight: 600, mb: 3 }}>
                  Quick Actions
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Add />}
                    onClick={() => navigate('/create')}
                    sx={{
                      bgcolor: 'rgba(59, 130, 246, 0.9)',
                      '&:hover': { 
                        bgcolor: '#3b82f6',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
                      },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5,
                      transition: 'all 0.3s ease'
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
                      borderColor: 'rgba(148, 163, 184, 0.3)',
                      color: '#94a3b8',
                      '&:hover': {
                        borderColor: '#3b82f6',
                        color: '#3b82f6',
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
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
                      borderColor: 'rgba(148, 163, 184, 0.3)',
                      color: '#94a3b8',
                      '&:hover': {
                        borderColor: '#3b82f6',
                        color: '#3b82f6',
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
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
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card 
              sx={{ 
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                borderRadius: 3,
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                flex: 1,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" component="h2" gutterBottom sx={{ color: '#f8fafc', fontWeight: 600, mb: 3 }}>
                  Account Summary
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                      Connected Address
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#f8fafc', 
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        wordBreak: 'break-all',
                        bgcolor: 'rgba(15, 23, 42, 0.8)',
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid rgba(148, 163, 184, 0.2)'
                      }}
                    >
                      {account}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.2)', my: 1 }} />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Total Invoices
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                      {stats.total}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Success Rate
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: stats.total > 0 && stats.paid > 0 ? '#22c55e' : '#94a3b8', 
                        fontWeight: 600 
                      }}
                    >
                      {stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Total Earned
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                      {stats.totalAmount.toFixed(3)} ETH
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Container>
    </Box>
  );
};

export default Dashboard;
