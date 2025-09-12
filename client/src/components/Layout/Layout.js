import React, { useState } from 'react';
import logo from '../../assets/logo.png';
import { AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, Toolbar, Typography, Button, Chip, Avatar, Menu, MenuItem, useTheme } from '@mui/material';
import { Menu as MenuIcon, Dashboard, Add, Receipt, Analytics, Settings, AccountBalanceWallet, Logout, ContentCopy } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { useInvoice } from '../../contexts/InvoiceContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

// Increased sidebar width
const drawerWidth = 160;
// Horizontal offset of the sidebar from the viewport left
const sidebarOffset = 20; 
// Desired visual gap between sidebar rounded edge and the top bar pill
const navGap = 16; 
// Large radius for pill-style curved corners on the top navigation bar
const topBarRadius = 2; // subtle rounding

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
	const pathname = location.pathname;
	// Edge-to-edge pages should sit flush with the sidebar (no extra navGap)
	const isEdgeToEdge = pathname === '/create' || pathname.startsWith('/invoice') || pathname === '/invoices';
	// Keep AppBar aligned as-is for all routes
	const appBarLeftOffset = drawerWidth + sidebarOffset + (isEdgeToEdge ? 0 : navGap);
	// For main content: remove extra nav gap on /settings only (do not move AppBar)
	// Also tighten a bit more (12px) to eliminate the visual padding next to the sidebar curve
	const mainLeftOffset = pathname === '/settings'
		? Math.max(0, drawerWidth + sidebarOffset - 12)
		: appBarLeftOffset;
	// Provide minimal left padding: zero on /invoices and /settings for tight alignment, default for others
	const pageLeftPadding = (pathname === '/invoices' || pathname === '/settings') ? 0 : (isEdgeToEdge ? 0 : 2);
	// Keep almost no space at the bottom across pages
	const pageBottomPadding = 0;
	const { account, balance, network, isConnected, connectWallet, disconnectWallet, formatAddress, isConnecting } = useWallet();
	const { user, logout: logoutAuth, loading: authLoading } = useAuth();
	const { userInfo, verifyWalletOwnership } = useInvoice();

	const [mobileOpen, setMobileOpen] = useState(false);
	const [anchorEl, setAnchorEl] = useState(null);

	const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
	const handleMenuClick = (e) => setAnchorEl(e.currentTarget);
	const handleMenuClose = () => setAnchorEl(null);

	const copyAddress = () => {
		if (account) {
			navigator.clipboard.writeText(account);
			toast.success('Address copied to clipboard!');
		}
		handleMenuClose();
	};
	const handleDisconnect = () => { disconnectWallet(); handleMenuClose(); };

	const drawer = (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0, pb: 1.5, mt: -1.70 }}>
			{/* Brand / Logo */}
			<Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: -0.75, pt: 0 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 0.375, // ~3px
                  py: 0.2,   // ~2px
                  borderRadius: 1.25,
                  bgcolor: 'transparent'
                }}
              >
                <Box
                  component="img"
                  src={logo}
                  alt="INVCHAIN"
                  sx={{
                    maxWidth: 132,
                    height: 'auto',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: theme.palette.mode === 'dark'
                      ? 'brightness(1.12) contrast(1.08) drop-shadow(0 0 1px rgba(255,255,255,0.22))'
                      : 'none',
                    transition: 'filter 0.2s ease'
                  }}
                />
              </Box>
            </Box>
			<List sx={{ p: 0, width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'flex-start', overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none', '&::-webkit-scrollbar': { width: 0, height: 0 }, /* hide by default */ '&:hover::-webkit-scrollbar': { width: 6 }, '&:hover::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)', borderRadius: 3 } }}>
				{menuItems.map((item) => {
					const selected = location.pathname === item.path;
					return (
						<ListItem key={item.text} disablePadding sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
							<ListItemButton
								selected={selected}
								onClick={() => navigate(item.path)}
								sx={{
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									py: 1.5,
									px: 1,
									gap: 0.25,
									minHeight: 64,
									borderRadius: 3,
									transition: 'all .25s ease',
									bgcolor: selected ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') : 'transparent',
									'&:hover': {
										bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
										transform: 'translateY(-2px)'
									},
									'&.Mui-selected': {
										boxShadow: theme.palette.mode === 'dark' ? '0 0 0 1px rgba(255,255,255,0.08)' : '0 0 0 1px rgba(0,0,0,0.08)'
									},
								}}
							>
								<ListItemIcon sx={{ minWidth: 'unset', color: selected ? theme.palette.text.primary : theme.palette.text.secondary, mb: 0.25 }}>
									{item.icon}
								</ListItemIcon>
								<Typography variant="caption" sx={{ fontWeight: 600, color: selected ? theme.palette.text.primary : theme.palette.text.secondary, textAlign: 'center', lineHeight: 1.15 }}>
									{item.text.replace(' ', '\n')}
								</Typography>
							</ListItemButton>
						</ListItem>
					);
				})}
			</List>
			<Box sx={{ height: 4 }} />
		</Box>
	);

	return (
		<Box sx={{ display: 'flex' }}>
			<CssBaseline />
			<AppBar
				position="fixed"
				elevation={0}
				sx={{
					// AppBar uses standard offset
					width: { sm: `calc(100% - ${appBarLeftOffset}px)` },
					ml: { sm: `${appBarLeftOffset}px` },
					background: 'transparent',
					boxShadow: 'none',
					borderBottom: 'none',
					backdropFilter: 'none',
					pt: 1
				}}
			>
				<Toolbar sx={{ minHeight: 64, px: { xs: 1, sm: 2 } }}>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							width: '100%',
							gap: 1.5,
							px: { xs: 1, sm: 1.5 }, // reduced internal horizontal padding to narrow visual gap
							py: 1,
							borderRadius: topBarRadius,
							background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
							border: `1px solid ${theme.palette.divider}`,
							boxShadow: theme.palette.mode === 'dark' ? '0 4px 28px -4px rgba(0,0,0,0.55)' : '0 6px 24px -4px rgba(0,0,0,0.15)',
							backdropFilter: 'blur(14px)',
							position: 'relative'
						}}
					>
						<IconButton
							color="inherit"
							aria-label="open drawer"
							edge="start"
							onClick={handleDrawerToggle}
							sx={{
								display: { sm: 'none' },
								color: theme.palette.text.primary,
								'&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.12)' : 'rgba(0,0,0,0.05)' }
							}}
						>
							<MenuIcon />
						</IconButton>
						{/* Logo removed from bar; now floating above sidebar */}
						<Typography
							variant="h6"
							noWrap
							component="div"
							sx={{
								flexGrow: 1,
								color: theme.palette.text.primary,
								fontWeight: 700,
								letterSpacing: '0.04em',
								fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem' },
								display: 'flex',
								alignItems: 'center'
							}}
						>
							Blockchain Invoicing Platform
						</Typography>

										{/* Right side grouped controls */}
										<Box
											sx={{
												display: 'flex',
																		alignItems: 'center',
																		gap: 1.75, // slightly increased over original but less than previous to reduce visual gaps
												ml: 'auto',
												px: 0.5,
												// No separate floating background container now
											}}
										>
												{network && (
													<Chip
														label={network.name}
														size="small"
														sx={{ bgcolor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', fontWeight: 600 }}
													/>
												)}
							{isConnected ? (
								<>
														<Typography variant="body2" sx={{ display: { xs: 'none', lg: 'block' }, color: theme.palette.text.secondary, fontWeight: 500, minWidth: 86 }}>
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
											// Compact, balanced interior spacing
											px: 2.2,
											py: 0.55,
											minWidth: 220,
											display: 'flex',
											alignItems: 'center',
											gap: 0.9,
											lineHeight: 1,
											'.MuiButton-startIcon': {
												m: 0,
												mr: 0.5,
												'& svg': { fontSize: 20 }
											},
											'&:hover': {
												bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.25)' : 'rgba(0,0,0,0.12)',
												transform: 'translateY(-1px)',
												boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(148,163,184,0.2)' : '0 4px 12px rgba(0,0,0,0.15)'
											},
											transition: 'all 0.3s ease'
										}}
									>
										<Avatar sx={{ width: 22, height: 22, mr: 0.5, bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.3)' : 'rgba(0,0,0,0.1)', color: theme.palette.text.primary, fontSize: '0.7rem', fontWeight: 600 }}>
											{account?.slice(2, 4).toUpperCase()}
										</Avatar>
										<Typography component="span" variant="body2" sx={{ fontWeight: 600, letterSpacing: '0.5px', lineHeight: 1 }}>
											{formatAddress(account)}
										</Typography>
									</Button>
									{userInfo?.verifiedWallet ? (
										<Chip label="Verified" size="small" sx={{ bgcolor: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }} />
									) : (
										<Button
											variant="outlined"
											size="small"
											onClick={verifyWalletOwnership}
											sx={{
												borderColor: 'rgba(34,197,94,0.3)',
												color: '#22c55e',
												backgroundColor: 'rgba(34,197,94,0.15)',
												fontWeight: 600,
												textTransform: 'none',
												borderRadius: '24px',
												px: 2.9,
												py: 0.85,
												fontSize: '0.9rem',
												'&:hover': {
													backgroundColor: 'rgba(34,197,94,0.22)',
													borderColor: 'rgba(34,197,94,0.45)'
												}
											}}
										>
											Verify
										</Button>
									)}
									{user ? (
										<>
											<Button onClick={() => navigate('/profile')} sx={{ color: theme.palette.text.primary, textTransform: 'none', fontWeight: 600 }} title="Open Profile">
												{userInfo?.name || user?.displayName || user?.email?.split('@')[0] || formatAddress(account) || 'Profile'}
											</Button>
											<Chip label="Linked" size="small" sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.15)' : 'rgba(0,0,0,0.08)', color: theme.palette.text.secondary, border: `1px solid ${theme.palette.divider}` }} />
											<Button onClick={logoutAuth} color="inherit" variant="outlined" size="small" sx={{ fontWeight: 600 }}>Out</Button>
										</>
									) : (
										<Button
											onClick={() => navigate('/login')}
											color="primary"
											variant="contained"
											size="small"
											disabled={authLoading}
											sx={{
												fontWeight: 600,
												textTransform: 'none',
												borderRadius: '24px',
												px: 2.4,
												py: 0.9,
												fontSize: '0.9rem',
												boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.15)',
												'&:hover': { boxShadow: theme.palette.mode === 'dark' ? '0 6px 16px rgba(0,0,0,0.55)' : '0 6px 18px rgba(0,0,0,0.2)' }
											}}
										>
											{authLoading ? 'Auth…' : 'Sign in'}
										</Button>
									)}
									<Menu
										anchorEl={anchorEl}
										open={Boolean(anchorEl)}
										onClose={handleMenuClose}
										transformOrigin={{ horizontal: 'right', vertical: 'top' }}
										anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
										sx={{ '& .MuiPaper-root': { background: theme.palette.background.paper, backdropFilter: 'blur(20px)', border: `1px solid ${theme.palette.divider}`, borderRadius: 2, mt: 1 } }}
									>
										<MenuItem onClick={copyAddress} sx={{ color: theme.palette.text.primary, '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.04)' } }}>
											<ContentCopy fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} /> Copy Address
										</MenuItem>
										<MenuItem onClick={handleDisconnect} sx={{ color: theme.palette.text.primary, '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
											<Logout fontSize="small" sx={{ mr: 1, color: '#ef4444' }} /> Disconnect
										</MenuItem>
									</Menu>
								</>
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
										'&:hover': { borderColor: theme.palette.text.secondary, bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.04)', transform: 'translateY(-1px)', boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(148,163,184,0.2)' : '0 4px 12px rgba(0,0,0,0.15)' },
										'&:disabled': { borderColor: 'rgba(148, 163, 184, 0.3)', color: 'rgba(148, 163, 184, 0.5)' },
										transition: 'all 0.3s ease'
									}}
								>
									{isConnecting ? 'Connecting...' : 'Connect Wallet'}
								</Button>
							)}
						</Box>
					</Box>
				</Toolbar>
			</AppBar>
			{/* Logo integrated into sidebar now */}
			<Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
				<Drawer
					variant="temporary"
						open={mobileOpen}
						onClose={handleDrawerToggle}
						ModalProps={{ keepMounted: true }}
						sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, background: theme.palette.background.default, borderRight: 'none', borderRadius: '0 24px 24px 0', boxShadow: theme.palette.mode === 'dark' ? '4px 0 16px rgba(0,0,0,0.4)' : '4px 0 16px rgba(0,0,0,0.08)', overflowY: 'auto', display: 'flex', flexDirection: 'column' } }}
				>
					{drawer}
				</Drawer>
				<Drawer
					variant="permanent"
					sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, background: theme.palette.background.default, borderRight: 'none', borderRadius: '32px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', boxShadow: theme.palette.mode === 'dark' ? '0 6px 28px rgba(0,0,0,0.55)' : '0 6px 24px rgba(0,0,0,0.12)', position: 'fixed', top: 0, left: 20, height: '100vh', overflowY: 'auto' } }}
					open
				>
					{drawer}
				</Drawer>
			</Box>
			{/* Adjust main content to match reduced gap */}
			<Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - ${mainLeftOffset}px)` }, ml: { sm: `${mainLeftOffset}px` }, pt: 2, pr: 2, pb: pageBottomPadding, pl: pageLeftPadding, boxSizing: 'border-box', position: 'relative', backgroundColor: theme.palette.background.default, borderRadius: { sm: '0 0 0 32px' } }}>
				<Box sx={{ mt: 8 }}>{children}</Box>
			</Box>
		</Box>
	);
};

export default Layout;
