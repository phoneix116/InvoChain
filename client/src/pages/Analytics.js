import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Alert, Container, Grid, Card, CardContent, CircularProgress, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useWallet } from '../contexts/WalletContext';
import invoiceAPI from '../services/invoiceAPI';

const numberOrZero = (v) => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return isNaN(n) ? 0 : n;
};

const KPI = ({ title, value, chip, color }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)'
          : theme.palette.background.paper,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 14px 32px rgba(0,0,0,0.45)'
          : '0 4px 16px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(24px) saturate(120%)',
        WebkitBackdropFilter: 'blur(24px) saturate(120%)'
      }}
    >
      <CardContent>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>{title}</Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h5" sx={{ color: color || theme.palette.text.primary, fontWeight: 700 }}>{value}</Typography>
          {chip}
        </Box>
      </CardContent>
    </Card>
  );
};

const Analytics = () => {
  const { account } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null); // { overview, monthlyData }

  useEffect(() => {
    const load = async () => {
      if (!account) return;
      setLoading(true);
      setError('');
      try {
        const res = await invoiceAPI.getUserAnalytics(account);
        setData(res.analytics);
      } catch (e) {
        setError(e?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [account]);

  const monthly = useMemo(() => {
    if (!data?.monthlyData) return [];
    return data.monthlyData.map((m) => ({
      month: m.month,
      count: Number(m.count),
      totalAmount: numberOrZero(m.totalAmount),
    }));
  }, [data]);

  const overview = data?.overview;

  const theme = useTheme();
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default, p: 2 }}>
      <Container maxWidth="xl" sx={{ ml: { xs: -5, sm: -10, md: -14 } }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{
          color: theme.palette.text.primary,
          fontWeight: 700,
          mb: 2,
          textAlign: 'left',
        }}>
          Analytics Dashboard
        </Typography>

        {!loading && !account && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Connect your wallet to view personalized analytics.
          </Alert>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

  {!loading && !error && overview && (
      <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6} md={3}>
              <KPI title="Total Invoices" value={overview.totalInvoices} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPI title="Paid" value={overview.paidInvoices} chip={<Chip size="small" label={`${overview.paymentRate}%`} color="success" />} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPI title="Pending" value={overview.pendingInvoices} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
      <KPI title="Total Earned" value={`${numberOrZero(overview.totalEarned).toFixed(3)} ETH`} color={theme.palette.mode === 'dark' ? '#22c55e' : theme.palette.primary.main} />
            </Grid>
          </Grid>
        )}

  {!loading && !error && account && monthly.length === 0 && (
          <Alert severity="info" sx={{ bgcolor: theme.palette.mode==='dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', border: `1px solid ${theme.palette.divider}`, color: theme.palette.text.primary, borderRadius: 2, backdropFilter: 'blur(10px) saturate(120%)' }}>
            Not enough data yet. Create invoices to see your analytics here.
          </Alert>
        )}

  {!loading && !error && monthly.length > 0 && (
      <Grid container spacing={2} alignItems="stretch">
    <Grid item xs={12} md={6}>
              <Card sx={{
                background: theme.palette.mode === 'dark' ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)' : theme.palette.background.paper,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                height: '100%',
                backdropFilter: 'blur(24px) saturate(120%)',
                WebkitBackdropFilter: 'blur(24px) saturate(120%)'
              }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary, mb: 1 }}>Monthly Invoices</Typography>
  <Box sx={{ height: 180, width: '100%', minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="month" stroke={theme.palette.text.secondary} tick={{ fontSize: 12 }} />
                        <YAxis stroke={theme.palette.text.secondary} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, color: theme.palette.text.primary }} />
                        <Legend />
                        <Bar dataKey="count" name="Invoices" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

    <Grid item xs={12} md={6}>
              <Card sx={{
                background: theme.palette.mode === 'dark' ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)' : theme.palette.background.paper,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                height: '100%',
                backdropFilter: 'blur(24px) saturate(120%)',
                WebkitBackdropFilter: 'blur(24px) saturate(120%)'
              }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary, mb: 1 }}>Monthly Revenue (ETH)</Typography>
  <Box sx={{ height: 180, width: '100%', minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="month" stroke={theme.palette.text.secondary} tick={{ fontSize: 12 }} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <Tooltip formatter={(v) => `${numberOrZero(v).toFixed(3)} ETH`} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, color: theme.palette.text.primary }} />
                        <Legend />
                        <Line type="monotone" dataKey="totalAmount" name="ETH" stroke={theme.palette.mode === 'dark' ? '#22c55e' : theme.palette.primary.main} strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Analytics;
