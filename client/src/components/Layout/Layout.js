import React, { useState } from 'react';
import {
	AppBar,
	Box,
	CssBaseline,
	Drawer,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Toolbar,
	Typography,
	Button,
	Chip,
	Avatar,
	Menu,
	MenuItem,
	useTheme,
} from '@mui/material';
import {
	Menu as MenuIcon,
	Dashboard,
	Add,
	Receipt,
	Analytics,
	Settings,
	AccountBalanceWallet,
	Logout,
	ContentCopy,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { useInvoice } from '../../contexts/InvoiceContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const drawerWidth = 240;

const menuItems = [
	{ text: 'Dashboard', icon: <Dashboard />, path: '/' },
	{ text: 'Create Invoice', icon: <Add />, path: '/create' },
	{ text: 'Invoices', icon: <Receipt />, path: '/invoices' },
	{ text: 'Analytics', icon: <Analytics />, path: '/analytics' },
	{ text: 'Settings', icon: <Settings />, path: '/settings' },
];

const Layout = ({ children }) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const location = useLocation();
	const {
		account,
		balance,
		network,
		isConnected,
		connectWallet,
		disconnectWallet,
		formatAddress,
		isConnecting,
	} = useWallet();
	const { user, logout: logoutAuth, loading: authLoading } = useAuth();
	const { userInfo, verifyWalletOwnership } = useInvoice();

	const [mobileOpen, setMobileOpen] = useState(false);
	const [anchorEl, setAnchorEl] = useState(null);

	const handleDrawerToggle = () => {
		setMobileOpen(!mobileOpen);
	};

	const handleMenuClick = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const copyAddress = () => {
		if (account) {
			navigator.clipboard.writeText(account);
			toast.success('Address copied to clipboard!');
		}
		handleMenuClose();
	};

	const handleDisconnect = () => {
		disconnectWallet();
		handleMenuClose();
	};

	const drawer = (
		<Box
			sx={{
				height: '100%',
				background: theme.palette.background.paper,
				backdropFilter: 'blur(20px)',
				borderRight: `1px solid ${theme.palette.divider}`,
			}}
		>
			<Box
				sx={{
					p: 3,
					borderBottom: `1px solid ${theme.palette.divider}`,
					background: theme.palette.background.paper,
					position: 'relative',
					'&::before': {
						content: '""',
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						height: '2px',
						background: `linear-gradient(90deg, transparent, ${theme.palette.divider}, transparent)`,
					}
				}}
			>
				<Typography 
					variant="h5" 
					noWrap 
					component="div" 
					sx={{ 
						fontWeight: 700,
						color: theme.palette.text.primary,
						textAlign: 'center',
						letterSpacing: '-0.025em'
					}}
				>
					InvoiceChain
				</Typography>
			</Box>
			<List sx={{ p: 2 }}>
				{menuItems.map((item) => (
					<ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
						<ListItemButton
							selected={location.pathname === item.path}
							onClick={() => navigate(item.path)}
							sx={{
								borderRadius: 2,
								mb: 0.5,
								transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
								'&:hover': {
									bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.04)',
									transform: 'translateX(4px)',
									boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(148,163,184,0.15)' : '0 4px 12px rgba(0,0,0,0.1)',
								},
								'&.Mui-selected': {
									bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.15)' : 'rgba(0,0,0,0.08)',
									border: `1px solid ${theme.palette.divider}`,
									boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(148,163,184,0.2)' : '0 4px 12px rgba(0,0,0,0.15)',
									'&:hover': {
										bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.2)' : 'rgba(0,0,0,0.12)',
									},
									'& .MuiListItemIcon-root': {
										color: theme.palette.text.primary,
									},
									'& .MuiListItemText-primary': {
										color: theme.palette.text.primary,
										fontWeight: 600,
									},
								},
								'& .MuiListItemIcon-root': {
									color: theme.palette.text.secondary,
									minWidth: 40,
								},
								'& .MuiListItemText-primary': {
									color: theme.palette.text.secondary,
									fontWeight: 500,
								},
							}}
						>
							<ListItemIcon>{item.icon}</ListItemIcon>
							<ListItemText primary={item.text} />
						</ListItemButton>
					</ListItem>
				))}
			</List>
		</Box>
	);

	return (
		<Box sx={{ display: 'flex' }}>
			<CssBaseline />
			<AppBar
				position="fixed"
				sx={{
					width: { sm: `calc(100% - ${drawerWidth}px)` },
					ml: { sm: `${drawerWidth}px` },
					background: theme.palette.background.paper,
					backdropFilter: 'blur(20px)',
					borderBottom: `1px solid ${theme.palette.divider}`,
					boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.1)',
				}}
			>
				<Toolbar>
					<IconButton
						color="inherit"
						aria-label="open drawer"
						edge="start"
						onClick={handleDrawerToggle}
						sx={{ 
							mr: 2, 
							display: { sm: 'none' },
							color: theme.palette.text.primary,
							'&:hover': {
								bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.04)',
							}
						}}
					>
						<MenuIcon />
					</IconButton>
          
					<Typography 
						variant="h6" 
						noWrap 
						component="div" 
						sx={{ 
							flexGrow: 1,
							color: theme.palette.text.primary,
							fontWeight: 600,
							letterSpacing: '-0.015em'
						}}
					>
						Blockchain Invoicing System
					</Typography>

					{/* Network indicator */}
					{network && (
						<Chip
							label={network.name}
							size="small"
							sx={{ 
								mr: 2,
								bgcolor: 'rgba(34, 197, 94, 0.15)',
								color: '#22c55e',
								border: '1px solid rgba(34, 197, 94, 0.3)',
								fontWeight: 600
							}}
						/>
					)}

					{/* Wallet connection */}
					{isConnected ? (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Typography 
								variant="body2" 
								sx={{ 
									display: { xs: 'none', md: 'block' },
									color: theme.palette.text.secondary,
									fontWeight: 500
								}}
							>
								{parseFloat(balance).toFixed(4)} ETH
							</Typography>
              
							<Button
								color="inherit"
								startIcon={<AccountBalanceWallet />}
								onClick={handleMenuClick}
								sx={{
									bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.15)' : 'rgba(0,0,0,0.08)',
									border: `1px solid ${theme.palette.divider}`,
									color: theme.palette.text.primary,
									borderRadius: 2,
									textTransform: 'none',
									fontWeight: 600,
									'&:hover': {
										bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.25)' : 'rgba(0,0,0,0.12)',
										transform: 'translateY(-1px)',
										boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(148,163,184,0.2)' : '0 4px 12px rgba(0,0,0,0.15)',
									},
									transition: 'all 0.3s ease'
								}}
							>
								<Avatar 
									sx={{ 
										width: 24, 
										height: 24, 
										mr: 1, 
										bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.3)' : 'rgba(0,0,0,0.1)',
										color: theme.palette.text.primary,
										fontSize: '0.75rem',
										fontWeight: 600
									}}
								>
									{account?.slice(2, 4).toUpperCase()}
								</Avatar>
								{formatAddress(account)}
							</Button>
							{userInfo?.verifiedWallet ? (
								<Chip
									label="Verified"
									size="small"
									sx={{ ml: 1, bgcolor: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
								/>
							) : (
								<Button
									variant="outlined"
									size="small"
									onClick={verifyWalletOwnership}
									sx={{ ml: 1, borderColor: theme.palette.divider, color: theme.palette.text.primary }}
								>
									Verify Wallet
								</Button>
							)}

							<Menu
								anchorEl={anchorEl}
								open={Boolean(anchorEl)}
								onClose={handleMenuClose}
								transformOrigin={{ horizontal: 'right', vertical: 'top' }}
								anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
								sx={{
									'& .MuiPaper-root': {
										background: theme.palette.background.paper,
										backdropFilter: 'blur(20px)',
										border: `1px solid ${theme.palette.divider}`,
										borderRadius: 2,
										mt: 1,
									}
								}}
							>
								<MenuItem 
									onClick={copyAddress}
									sx={{
										color: theme.palette.text.primary,
										'&:hover': {
											bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.04)',
										}
									}}
								>
									<ContentCopy fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
									Copy Address
								</MenuItem>
								<MenuItem 
									onClick={handleDisconnect}
									sx={{
										color: theme.palette.text.primary,
										'&:hover': {
											bgcolor: 'rgba(239, 68, 68, 0.1)',
										}
									}}
								>
									<Logout fontSize="small" sx={{ mr: 1, color: '#ef4444' }} />
									Disconnect
								</MenuItem>
							</Menu>
						</Box>
					) : (
						<Button
							color="inherit"
							variant="outlined"
							startIcon={<AccountBalanceWallet />}
							onClick={connectWallet}
							disabled={isConnecting}
							sx={{ 
								borderColor: theme.palette.divider,
								color: theme.palette.text.primary,
								borderRadius: 2,
								textTransform: 'none',
								fontWeight: 600,
								'&:hover': { 
									borderColor: theme.palette.text.secondary,
									bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.04)',
									transform: 'translateY(-1px)',
									boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(148,163,184,0.2)' : '0 4px 12px rgba(0,0,0,0.15)',
								},
								'&:disabled': {
									borderColor: 'rgba(148, 163, 184, 0.3)',
									color: 'rgba(148, 163, 184, 0.5)',
								},
								transition: 'all 0.3s ease'
							}}
						>
							{isConnecting ? 'Connecting...' : 'Connect Wallet'}
						</Button>
					)}

					{/* Auth */}
					{user ? (
						<>
							<Button
								onClick={() => navigate('/profile')}
								sx={{ ml: 2, color: theme.palette.text.primary, textTransform: 'none', fontWeight: 700 }}
								title="Open Profile"
							>
								{userInfo?.name || user?.displayName || user?.email?.split('@')[0] || formatAddress(account) || 'Profile'}
							</Button>
							<Chip 
								label="Linked" 
								size="small" 
								sx={{ 
									ml: 1, 
									bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.15)' : 'rgba(0,0,0,0.08)', 
									color: theme.palette.text.secondary, 
									border: `1px solid ${theme.palette.divider}` 
								}} 
							/>
							<Button onClick={logoutAuth} sx={{ ml: 1 }} color="inherit" variant="outlined">Logout</Button>
						</>
					) : (
						<Button onClick={() => navigate('/login')} sx={{ ml: 2 }} color="inherit" variant="outlined" disabled={authLoading}>
							{authLoading ? 'Auth…' : 'Sign in'}
						</Button>
					)}
				</Toolbar>
			</AppBar>

			<Box
				component="nav"
				sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
			>
				<Drawer
					variant="temporary"
					open={mobileOpen}
					onClose={handleDrawerToggle}
					ModalProps={{
						keepMounted: true,
					}}
					sx={{
						display: { xs: 'block', sm: 'none' },
						'& .MuiDrawer-paper': { 
							boxSizing: 'border-box', 
							width: drawerWidth,
							background: theme.palette.background.paper,
							backdropFilter: 'blur(20px)',
							borderRight: `1px solid ${theme.palette.divider}`,
						},
					}}
				>
					{drawer}
				</Drawer>
				<Drawer
					variant="permanent"
					sx={{
						display: { xs: 'none', sm: 'block' },
						'& .MuiDrawer-paper': { 
							boxSizing: 'border-box', 
							width: drawerWidth,
							background: theme.palette.background.paper,
							backdropFilter: 'blur(20px)',
							borderRight: `1px solid ${theme.palette.divider}`,
						},
					}}
					open
				>
					{drawer}
				</Drawer>
			</Box>

			<Box
				component="main"
				sx={{
					flexGrow: 1,
					background: theme.palette.background.default,
					minHeight: '100vh',
					width: { sm: `calc(100% - ${drawerWidth}px)` },
				}}
			>
				<Box sx={{ mt: 8 }}>
					{children}
				</Box>
			</Box>
		</Box>
	);
};

export default Layout;
