import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
} from '@mui/material';
import { useWallet } from '../contexts/WalletContext';
import { useInvoice } from '../contexts/InvoiceContext';
import invoiceAPI from '../services/invoiceAPI';
import { toast } from 'react-toastify';

const Settings = () => {
  return (
    <Box 
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        p: 3
      }}
    >
      <Container maxWidth="lg">
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            color: '#f8fafc', 
            fontWeight: 700,
            mb: 4,
            textAlign: 'center',
            background: 'linear-gradient(90deg, #f8fafc 0%, #60a5fa 50%, #f8fafc 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Application Settings
        </Typography>
        
  <Alert 
          severity="info"
          sx={{
            bgcolor: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            color: '#6366f1',
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#6366f1'
            },
            '& ul': {
              color: '#94a3b8',
              mt: 1
            },
            '& li': {
              mb: 0.5
            }
          }}
        >
          <Typography variant="body1" sx={{ color: '#f8fafc', fontWeight: 600, mb: 2 }}>
            Settings configuration panel coming soon!
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
            This settings panel will provide comprehensive control over:
          </Typography>
          <ul>
            <li>Custom invoice templates and branding options</li>
            <li>Email and push notification preferences</li>
            <li>Multiple payment gateway integrations</li>
            <li>Tax rates and calculation configurations</li>
            <li>Personal account and security preferences</li>
            <li>Data export and backup settings</li>
          </ul>
        </Alert>

        {/* Profile Card */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2, fontWeight: 700 }}>User Profile</Typography>
                <ProfileForm />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Settings;

// Inline Profile form component
const ProfileForm = () => {
  const { account, formatAddress } = useWallet();
  const { userInfo, updateUserInfo } = useInvoice();
  const [form, setForm] = useState({ name: '', email: '', company: '', timezone: '', defaultCurrency: 'ETH', notifications: true });
  const verified = useMemo(() => !!userInfo?.verifiedWallet, [userInfo]);

  useEffect(() => {
    if (userInfo) {
      setForm({
        name: userInfo.name || '',
        email: userInfo.email || '',
        company: userInfo.company || '',
        timezone: userInfo.preferences?.timezone || 'UTC',
        defaultCurrency: userInfo.preferences?.defaultCurrency || 'ETH',
        notifications: !!userInfo.preferences?.notifications,
      });
    }
  }, [userInfo]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const save = async () => {
    try {
      await updateUserInfo({
        theme: userInfo?.preferences?.theme || 'dark',
        timezone: form.timezone,
        defaultCurrency: form.defaultCurrency,
        notifications: form.notifications,
      });
      // Also persist name/email/company if changed via profile endpoint
      await invoiceAPI.createOrGetUser({
        walletAddress: account,
        name: form.name,
        email: form.email,
        company: form.company,
      });
      toast.success('Profile saved');
    } catch (e) {
      toast.error(e.message || 'Failed to save');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Wallet:</Typography>
        <Typography variant="body2" sx={{ color: '#f8fafc', fontWeight: 600 }}>{formatAddress(account)}</Typography>
        {verified ? (
          <Chip size="small" label="Verified" sx={{ bgcolor: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }} />
        ) : (
          <Chip size="small" label="Unverified" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }} />
        )}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Name" name="name" value={form.name} onChange={onChange} variant="outlined" InputLabelProps={{ sx: { color: '#94a3b8' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#f8fafc' } }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Email" name="email" value={form.email} onChange={onChange} variant="outlined" InputLabelProps={{ sx: { color: '#94a3b8' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#f8fafc' } }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Company" name="company" value={form.company} onChange={onChange} variant="outlined" InputLabelProps={{ sx: { color: '#94a3b8' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#f8fafc' } }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Timezone" name="timezone" value={form.timezone} onChange={onChange} variant="outlined" InputLabelProps={{ sx: { color: '#94a3b8' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#f8fafc' } }} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Default Currency" name="defaultCurrency" value={form.defaultCurrency} onChange={onChange} variant="outlined" InputLabelProps={{ sx: { color: '#94a3b8' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#f8fafc' } }} />
        </Grid>
      </Grid>

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={save}>Save</Button>
        <Button variant="outlined" onClick={() => setForm({ name: userInfo?.name || '', email: userInfo?.email || '', company: userInfo?.company || '', timezone: userInfo?.preferences?.timezone || 'UTC', defaultCurrency: userInfo?.preferences?.defaultCurrency || 'ETH', notifications: !!userInfo?.preferences?.notifications })}>Reset</Button>
      </Box>
    </Box>
  );
};
