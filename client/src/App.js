import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Container, Box } from '@mui/material';

import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceList from './pages/InvoiceList';
import InvoiceDetails from './pages/InvoiceDetails';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Profile from './pages/Profile';

function App() {
  const location = useLocation();
  const isFullWidthPage = location.pathname.startsWith('/invoice') || location.pathname === '/create';
  const isInvoiceList = location.pathname === '/invoices' || location.pathname === '/settings';

  const PageWrapper = ({ children }) => {
    if (isFullWidthPage) {
      return <Box sx={{ mt: 4, mb: 0 }}>{children}</Box>; // reduce bottom gap
    }
    return (
      <Container maxWidth={isInvoiceList ? false : "xl"} disableGutters={isInvoiceList} sx={{ mt: 4, mb: 0, px: isInvoiceList ? 0 : 3 }}>
        {children}
      </Container>
    );
  };

  return (
    <Layout>
      <PageWrapper>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateInvoice />} />
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoice/:id" element={<InvoiceDetails />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </PageWrapper>
    </Layout>
  );
}

export default App;
