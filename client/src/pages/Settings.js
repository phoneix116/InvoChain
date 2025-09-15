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
import { useTheme } from '@mui/material/styles';
import { useThemeMode } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { useInvoice } from '../contexts/InvoiceContext';
import invoiceAPI from '../services/invoiceAPI';
import { toast } from 'react-toastify';

const Settings = () => {
  const theme = useTheme();
  const { mode, toggle } = useThemeMode();

  return (
  <Box sx={{ minHeight: '100vh', background: 'transparent', pt: 3, pr: 3, pb: 0, pl: 0 }}>
      <Container maxWidth={false} disableGutters sx={{ px: 0 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            color: theme.palette.text.primary, 
            fontWeight: 700,
            mb: 2,
            textAlign: 'left',
            letterSpacing: '-0.015em'
          }}
        >
          Application Settings
        </Typography>
        
        {/* Theme Mode Toggle Card */}
        <Card sx={{ 
          background: theme.palette.mode === 'dark' ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)' : theme.palette.background.paper, 
          border: `1px solid ${theme.palette.divider}`,
          mb: 0.5, // reduce space below the card
          borderRadius: 3
        }}>
          <CardContent sx={{ pb: 1.25 }}> {/* tighten bottom padding */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Theme Mode
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Switch between dark and light themes
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {mode === 'dark' ? 'Dark' : 'Light'}
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={toggle}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    minWidth: 120
                  }}
                >
                  Switch to {mode === 'dark' ? 'Light' : 'Dark'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
    {/* Alert + Profile side-by-side */}
  <Grid container spacing={2} sx={{ mt: 0 }} alignItems="stretch"> {/* reduce gap to next section */}
      <Grid item xs={5} sm={2} md={6}>
            <Alert 
              severity="info"
              sx={{
        py: 1, // equal vertical padding reduction
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.08)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  color: theme.palette.text.secondary
                },
                '& ul': {
                  color: theme.palette.text.secondary,
                  mt: 1
                },
                '& li': {
                  mb: 0.5
                }
              }}
            >
              <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 2 }}>
                Settings configuration panel coming soon!
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
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
          </Grid>

          {/* Profile Card */}
      <Grid item xs={12} sm={6} md={6}>
            <Card sx={{ background: theme.palette.mode === 'dark' ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.045) 100%)' : theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
        <CardContent sx={{ py: 1 }}> {/* equal vertical padding reduction */}
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 2, fontWeight: 700 }}>User Profile</Typography>
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

  const theme = useTheme();
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Wallet:</Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>{formatAddress(account)}</Typography>
        {/* Verification status chip removed */}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Name" name="name" value={form.name} onChange={onChange} variant="outlined" />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Email" name="email" value={form.email} onChange={onChange} variant="outlined" />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Company" name="company" value={form.company} onChange={onChange} variant="outlined" />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Timezone" name="timezone" value={form.timezone} onChange={onChange} variant="outlined" />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Default Currency" name="defaultCurrency" value={form.defaultCurrency} onChange={onChange} variant="outlined" />
        </Grid>
      </Grid>

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={save}>Save</Button>
        <Button variant="outlined" onClick={() => setForm({ name: userInfo?.name || '', email: userInfo?.email || '', company: userInfo?.company || '', timezone: userInfo?.preferences?.timezone || 'UTC', defaultCurrency: userInfo?.preferences?.defaultCurrency || 'ETH', notifications: !!userInfo?.preferences?.notifications })}>Reset</Button>
      </Box>
    </Box>
  );
};
