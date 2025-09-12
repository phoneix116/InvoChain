import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  TablePagination,
  InputAdornment,
  Grid,
  MenuItem,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material';
import {
  Search,
  Visibility,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useWallet } from '../contexts/WalletContext';
import { useInvoice } from '../contexts/InvoiceContext';

const InvoiceList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isConnected, account, formatAddress } = useWallet();
  const { userInvoices, loading, loadUserInvoices, formatInvoiceStatus, getStatusColor } = useInvoice();

  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (isConnected && account) {
      loadUserInvoices();
    }
  }, [isConnected, account, loadUserInvoices]);

  useEffect(() => {
    let filtered = [...userInvoices];

    // Apply search filter
    if (searchTerm) {
      const term = String(searchTerm).toLowerCase();
      filtered = filtered.filter(invoice => {
        const idStr = String(invoice.id ?? invoice.invoiceId ?? '').toLowerCase();
        const descStr = String(invoice.description ?? invoice.title ?? '').toLowerCase();
        const recipientStr = String(invoice.recipient?.walletAddress ?? invoice.recipient ?? '').toLowerCase();
        return (
          (idStr && idStr.includes(term)) ||
          (descStr && descStr.includes(term)) ||
          (recipientStr && recipientStr.includes(term))
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => {
        const invStatus = typeof invoice.status === 'string' 
          ? invoice.status.toLowerCase() 
          : invoice.status;
        const filterNum = parseInt(statusFilter);
        if (!isNaN(filterNum) && typeof invStatus === 'number') {
          return invStatus === filterNum;
        }
        if (typeof invStatus === 'string') {
          return invStatus === String(statusFilter).toLowerCase();
        }
        return false;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = parseFloat(a.amount);
          bValue = parseFloat(b.amount);
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredInvoices(filtered);
    setPage(0); // reset page when filters change
  }, [userInvoices, searchTerm, statusFilter, sortBy, sortOrder]);

  const paginatedInvoices = React.useMemo(() => {
    const start = page * rowsPerPage;
    return filteredInvoices.slice(start, start + rowsPerPage);
  }, [filteredInvoices, page, rowsPerPage]);

  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    loadUserInvoices();
  };

  const handleViewInvoice = (invoiceId) => {
    navigate(`/invoice/${invoiceId}`);
  };

  const formatAmount = (amount) => {
    try {
      if (!amount) return '0.0000';
      const numAmount = typeof amount === 'object' ? parseFloat(amount.toString()) : parseFloat(amount);
      return isNaN(numAmount) ? '0.0000' : numAmount.toFixed(4);
    } catch (error) {
      console.warn('Error formatting amount:', error);
      return '0.0000';
    }
  };

  const getStatusBadge = (status) => (
    <Chip
      label={formatInvoiceStatus(status)}
      color={getStatusColor(status)}
      size="small"
      variant="outlined"
    />
  );


  if (!isConnected) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.palette.mode === 'dark'
              ? `radial-gradient(circle at 20% 80%, rgba(59,130,246,0.12) 0%, transparent 55%),
                 radial-gradient(circle at 80% 20%, rgba(147,197,253,0.12) 0%, transparent 55%)`
              : `radial-gradient(circle at 20% 80%, rgba(59,130,246,0.08) 0%, transparent 55%),
                 radial-gradient(circle at 80% 20%, rgba(147,197,253,0.08) 0%, transparent 55%)`,
            pointerEvents: 'none',
          }
        }}
      >
        <Container maxWidth="xl" sx={{ pt: 4, position: 'relative', zIndex: 1 }}>
          <Alert 
            severity="warning"
            sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(145deg, rgba(120,53,15,0.95) 0%, rgba(146,64,14,0.95) 100%)'
                : 'linear-gradient(145deg, rgba(255,247,237,0.95) 0%, rgba(255,237,213,0.95) 100%)',
              color: theme.palette.warning.main,
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(245,158,11,0.3)' : 'rgba(217,119,6,0.35)'}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            Please connect your wallet to view your invoices.
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
  <Box sx={{ minHeight: '100vh', height: '100vh', backgroundColor: theme.palette.background.default, display:'flex', flexDirection:'column', overflowX:'hidden', overflowY:'auto' }}>
      <Box sx={{ flex:1, display:'flex', flexDirection:'column', pt: 2, pb: 2, position: 'relative', zIndex: 1 }}>
        <Box sx={{ flexShrink:0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography
              variant="h3" 
              component="h1"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: { xs: '1.6rem', md: '2rem' },
                letterSpacing: '-0.025em'
              }}
            >
              My Invoices
            </Typography>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={loading}
              sx={{
                bgcolor: theme.palette.primary.main,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.4)' : theme.palette.primary.light}`,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 10px 25px rgba(0,0,0,0.4)'
                  : '0 6px 18px rgba(0,0,0,0.15)',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 15px 35px rgba(0,0,0,0.55)'
                    : '0 10px 28px rgba(0,0,0,0.2)',
                },
                '&:disabled': {
                  bgcolor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ flexShrink:0 }}>
          <Card
            sx={{ 
              mb: 1.5,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)'
                : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.95) 100%)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.25)' : 'rgba(203,213,225,0.6)'}`,
              borderRadius: 3,
              backdropFilter: 'blur(24px) saturate(120%)',
              WebkitBackdropFilter: 'blur(24px) saturate(120%)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 25px 50px rgba(0,0,0,0.35)'
                : '0 10px 30px rgba(0,0,0,0.08)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
              }
            }}
          >
            <CardContent sx={{ p: 1.5 }}>
              <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
                placeholder="Search by ID, description, or recipient"
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
                  '& .MuiInputBase-input::placeholder': { color: theme.palette.text.disabled, opacity: 1 },
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                  '& .MuiSelect-select': { color: theme.palette.text.primary },
                  '& .MuiSvgIcon-root': { color: theme.palette.text.secondary },
                }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="0">Created</MenuItem>
                <MenuItem value="1">Paid</MenuItem>
                <MenuItem value="2">Disputed</MenuItem>
                <MenuItem value="3">Resolved</MenuItem>
                <MenuItem value="4">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
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
                  '& .MuiSelect-select': { color: theme.palette.text.primary },
                  '& .MuiSvgIcon-root': { color: theme.palette.text.secondary },
                }}
              >
                <MenuItem value="createdAt">Created Date</MenuItem>
                <MenuItem value="dueDate">Due Date</MenuItem>
                <MenuItem value="amount">Amount</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                label="Order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
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
                  '& .MuiSelect-select': { color: theme.palette.text.primary },
                  '& .MuiSvgIcon-root': { color: theme.palette.text.secondary },
                }}
              >
                <MenuItem value="desc">Newest First</MenuItem>
                <MenuItem value="asc">Oldest First</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card
        sx={{
          flex:1,
          display:'flex',
          flexDirection:'column',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)'
            : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.95) 100%)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.25)' : 'rgba(203,213,225,0.6)'}`,
          borderRadius: 3,
          backdropFilter: 'blur(24px) saturate(120%)',
          WebkitBackdropFilter: 'blur(24px) saturate(120%)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 18px 40px rgba(0,0,0,0.35)'
            : '0 8px 24px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow:'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
          }
        }}
      >
  <CardContent sx={{ p: 1.5, display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : filteredInvoices.length === 0 ? (
            <Alert severity="info">
              {userInvoices.length === 0 
                ? "No invoices found. Create your first invoice to get started!"
                : "No invoices match your current filters."
              }
            </Alert>
          ) : (
            <>
            <TableContainer sx={{ flex:1, pr:0.5 }}>
              <Table size="small" stickyHeader sx={{ tableLayout:'fixed', '& .MuiTableCell-root': { py: 0.5, px: 1 }, '& thead th': { background: theme.palette.mode==='dark' ? 'rgba(255,255,255,0.06)' : 'rgba(241,245,249,0.9)', backdropFilter:'blur(10px) saturate(120%)' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>ID</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>Recipient</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>Amount</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>Created</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>Due Date</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedInvoices.map((invoice) => (
                    <TableRow key={invoice.id} hover sx={{ '&:hover': { bgcolor: theme.palette.action.hover } }}>
                      <TableCell sx={{ borderColor: theme.palette.divider }}>
                        <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                          #{invoice.id}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: theme.palette.divider }}>
                        <Tooltip title={invoice.recipient?.walletAddress || invoice.recipient}>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontFamily: 'monospace' }}>
                            {formatAddress(invoice.recipient?.walletAddress || invoice.recipient)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ borderColor: theme.palette.divider }}>
                        <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                          {formatAmount(invoice.amount)} ETH
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: theme.palette.divider }}>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell sx={{ borderColor: theme.palette.divider }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: theme.palette.divider }}>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderColor: theme.palette.divider }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewInvoice(invoice.id || invoice.invoiceId)}
                            sx={{ 
                              color: theme.palette.text.secondary,
                              '&:hover': { 
                                color: theme.palette.primary.main,
                                bgcolor: theme.palette.action.hover 
                              }
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box mt={1} display="flex" justifyContent="space-between" alignItems="center" flexShrink={0}>
              <Box>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display:'block' }}>
                  {filteredInvoices.length === 0 ? 'No invoices' : `Showing ${paginatedInvoices.length} of ${filteredInvoices.length} filtered (${userInvoices.length} total)`}
                </Typography>
              </Box>
              <TablePagination
                component="div"
                count={filteredInvoices.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5,10,25,50]}
                labelRowsPerPage="Rows"
                showFirstButton
                showLastButton
                sx={{ '& .MuiTablePagination-toolbar': { p: 0, minHeight: 40 }, '& .MuiTablePagination-displayedRows': { mr: 1 } }}
              />
            </Box>
            </>
          )}
        </CardContent>
      </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default InvoiceList;
