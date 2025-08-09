import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Alert, Container, Grid, Card, CardContent, CircularProgress, Chip } from '@mui/material';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useWallet } from '../contexts/WalletContext';
import invoiceAPI from '../services/invoiceAPI';

const numberOrZero = (v) => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return isNaN(n) ? 0 : n;
};

const KPI = ({ title, value, chip, color = '#f8fafc' }) => (
  <Card sx={{ background: 'rgba(15, 23, 42, 0.9)', borderRadius: 3, border: '1px solid rgba(148, 163, 184, 0.2)' }}>
    <CardContent>
      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>{title}</Typography>
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="h5" sx={{ color, fontWeight: 700 }}>{value}</Typography>
        {chip}
      </Box>
    </CardContent>
  </Card>
);

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

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', p: 3 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#f8fafc', fontWeight: 700, mb: 4, textAlign: 'center', background: 'linear-gradient(90deg, #f8fafc 0%, #60a5fa 50%, #f8fafc 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
          <Grid container spacing={3} mb={2}>
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
              <KPI title="Total Earned" value={`${numberOrZero(overview.totalEarned).toFixed(3)} ETH`} color="#22c55e" />
            </Grid>
          </Grid>
        )}

  {!loading && !error && account && monthly.length === 0 && (
          <Alert severity="info" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6', borderRadius: 2 }}>
            Not enough data yet. Create invoices to see your analytics here.
          </Alert>
        )}

  {!loading && !error && monthly.length > 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ background: 'rgba(15, 23, 42, 0.9)', borderRadius: 3, border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2 }}>Monthly Invoices</Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                        <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', color: '#f8fafc' }} />
                        <Legend />
                        <Bar dataKey="count" name="Invoices" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ background: 'rgba(15, 23, 42, 0.9)', borderRadius: 3, border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2 }}>Monthly Revenue (ETH)</Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                        <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip formatter={(v) => `${numberOrZero(v).toFixed(3)} ETH`} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', color: '#f8fafc' }} />
                        <Legend />
                        <Line type="monotone" dataKey="totalAmount" name="ETH" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
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
