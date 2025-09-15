import React, { useState, useEffect } from 'react';
import logo from '../../assets/logo.png';
import { AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, Toolbar, Typography, Button, Chip, Avatar, Menu, MenuItem, useTheme } from '@mui/material';
import { Menu as MenuIcon, Dashboard, Add, Receipt, Analytics, Settings, AccountBalanceWallet, Logout, ContentCopy } from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { useInvoice } from '../../contexts/InvoiceContext';
import { useAuth } from '../../contexts/AuthContext';
import useUnifiedAuth from '../../hooks/useUnifiedAuth';
import Login from '../../pages/Login';
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
	const { user, loading: authLoading } = useAuth();
	// Need all unified auth actions & state; missing ones caused runtime ReferenceError (blank screen)
	const { unifiedSignIn, unifiedSignOut, signingIn, signingOut, unifiedAuthBusy } = useUnifiedAuth();
	const { userInfo, verifyWalletOwnership } = useInvoice();

	const [mobileOpen, setMobileOpen] = useState(false);

	// Determine if we should show the auth overlay: require BOTH wallet connection and Firebase user
	const fullyAuthed = !!user && isConnected;
	const showAuthOverlay = !authLoading && !fullyAuthed;

	// Lock body scroll while overlay is active
	useEffect(() => {
		if (showAuthOverlay) {
			document.body.style.overflow = 'hidden';
			return () => { document.body.style.overflow = ''; };
		} else {
			document.body.style.overflow = '';
		}
	}, [showAuthOverlay]);
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

	const content = children || <Outlet />;
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
												{/* Network chip removed */}
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
									{/* Wallet verification UI removed */}
									{user ? (
										<>
											<Button onClick={() => navigate('/profile')} sx={{ color: theme.palette.text.primary, textTransform: 'none', fontWeight: 600 }} title="Open Profile">
												{userInfo?.name || user?.displayName || user?.email?.split('@')[0] || formatAddress(account) || 'Profile'}
											</Button>
											{/* Linked status chip removed */}
											<Button
												onClick={unifiedSignOut}
												color="inherit"
												variant="outlined"
												size="small"
												startIcon={<Logout fontSize="small" />}
												aria-label="Sign out"
												disabled={signingOut}
												sx={{
													fontWeight: 600,
													letterSpacing: 0.3,
													borderRadius: '24px',
													px: 2.2,
													py: 0.8,
													lineHeight: 1.05,
													borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)',
													color: signingOut ? theme.palette.text.disabled : (theme.palette.mode === 'dark' ? theme.palette.text.primary : '#dc2626'),
													backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(220,38,38,0.08)',
													textTransform: 'none',
													fontSize: '0.8rem',
													backdropFilter: 'blur(6px)',
													transition: 'all .25s ease',
													'&:hover': !signingOut ? {
														borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.45)' : '#dc2626',
														backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(220,38,38,0.16)',
														transform: 'translateY(-1px)',
														boxShadow: theme.palette.mode === 'dark'
															? '0 4px 12px rgba(0,0,0,0.5)'
															: '0 4px 12px rgba(0,0,0,0.18)'
													} : undefined,
													'& .MuiButton-startIcon': { mr: 0.4 }
												}}
											>
												{signingOut ? 'Signing out…' : 'Sign out'}
											</Button>
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
												px: 2.6,
												py: 0.95,
												fontSize: '0.9rem',
												boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.15)',
												'&:hover': { boxShadow: theme.palette.mode === 'dark' ? '0 6px 16px rgba(0,0,0,0.55)' : '0 6px 18px rgba(0,0,0,0.2)' }
											}}
										>
											{authLoading ? 'Loading…' : 'Sign in'}
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
                                    onClick={unifiedSignIn}
                                    disabled={signingIn || unifiedAuthBusy}
                                    sx={{
                                        borderColor: theme.palette.divider,
                                        color: theme.palette.text.primary,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        px: 2.4,
                                        py: 0.85,
                                        '&:hover': { borderColor: theme.palette.text.secondary, bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.05)', transform: 'translateY(-1px)', boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(148,163,184,0.2)' : '0 4px 12px rgba(0,0,0,0.15)' },
                                        '&:disabled': { borderColor: theme.palette.divider, color: theme.palette.text.disabled },
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {(signingIn || unifiedAuthBusy) ? 'Signing in…' : 'Sign in'}
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
			<Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - ${mainLeftOffset}px)` }, ml: { sm: `${mainLeftOffset}px` }, pt: 2, pr: 2, pb: pageBottomPadding, pl: pageLeftPadding, boxSizing: 'border-box', position: 'relative', backgroundColor: theme.palette.background.default, borderRadius: { sm: '0 0 0 32px' }, filter: showAuthOverlay ? 'blur(2px) saturate(0.85)' : 'none', transition: 'filter 0.4s ease' }} aria-hidden={showAuthOverlay ? 'true' : 'false'}>
				<Box sx={{ mt: 8 }}>{content}</Box>
			</Box>

			{/* Full-screen auth overlay (glass) */}
			{showAuthOverlay && (
				<Box
					sx={{
						position: 'fixed',
						inset: 0,
						zIndex: (theme) => theme.zIndex.drawer + 500,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						p: { xs: 2.5, sm: 4 },
						background: theme.palette.mode === 'dark'
							? 'linear-gradient(135deg, rgba(10,12,16,0.82) 0%, rgba(18,22,28,0.78) 60%, rgba(24,28,34,0.85) 100%)'
							: 'linear-gradient(135deg, rgba(240,245,255,0.86) 0%, rgba(250,252,255,0.82) 60%, rgba(255,255,255,0.90) 100%)',
						backdropFilter: 'blur(28px) saturate(1.8)',
						WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
						'&:before': {
							content: '""',
							position: 'absolute',
							inset: 0,
							background: theme.palette.mode === 'dark'
								? 'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.08), transparent 55%), radial-gradient(circle at 75% 70%, rgba(255,255,255,0.05), transparent 60%)'
								: 'radial-gradient(circle at 25% 20%, rgba(0,0,0,0.08), transparent 55%), radial-gradient(circle at 75% 70%, rgba(0,0,0,0.04), transparent 60%)',
							pointerEvents: 'none'
						},
						'&:after': {
							content: '""',
							position: 'absolute',
							inset: 0,
							backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'1600\' height=\'900\' viewBox=\'0 0 1600 900\'%3E%3Cdefs%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/defs%3E%3Crect width=\'1600\' height=\'900\' filter=\'url(%23n)\' opacity=\'0.18\'/%3E%3C/svg%3E")',
							opacity: theme.palette.mode === 'dark' ? 0.22 : 0.12,
							mixBlendMode: theme.palette.mode === 'dark' ? 'screen' : 'multiply',
							pointerEvents: 'none'
						}
					}}
				>
					<Box sx={{ position: 'relative', width: '100%', maxWidth: 640 }}>
						<Login embedded />
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default Layout;
