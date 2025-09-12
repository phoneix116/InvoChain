import React from 'react';
import { Card, CardContent, Box, Typography, Avatar, Skeleton, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

const Delta = ({ value }) => {
  if (value == null) return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return null;
  const positive = num > 0;
  const neutral = num === 0;
  return (
    <Typography
      variant="caption"
      sx={{
        fontWeight: 600,
        color: neutral ? 'text.secondary' : positive ? 'success.main' : 'error.main'
      }}
    >
      {positive ? '+' : ''}{num.toFixed(1)}%
    </Typography>
  );
};

// Helper to choose a font size that better fills available width/height based on length
const calcFontSize = (raw) => {
  if (raw == null) return '2.2rem';
  const str = String(raw);
  const len = str.length;
  if (len <= 3) return '3rem';
  if (len <= 4) return '2.7rem';
  if (len <= 6) return '2.4rem';
  if (len <= 8) return '2.05rem';
  if (len <= 10) return '1.75rem';
  if (len <= 14) return '1.55rem';
  return '1.35rem';
};

export const KPIStat = ({ icon, label, value, delta, loading, children, color = 'primary' }) => {
  const theme = useTheme();
  const dynamicFontSize = calcFontSize(value);
  const paletteColor = theme.palette[color] || theme.palette.primary;
  const iconElement = React.isValidElement(icon)
    ? React.cloneElement(icon, {
        sx: {
          // Make icon colorful (tinted by provided color prop)
          color: paletteColor.main,
          fontSize: 28,
          opacity: 1,
          filter: theme.palette.mode === 'dark'
            ? `drop-shadow(0 2px 10px ${alpha(paletteColor.main, 0.45)})`
            : `drop-shadow(0 2px 6px ${alpha(paletteColor.main, 0.35)})`
        }
      })
    : icon;
  return (
    <Card
      sx={{
        position: 'relative',
        height: 160, // uniform fixed card height
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    flex: 1,
        borderRadius: 4,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.04) 60%, rgba(255,255,255,0.03) 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 8px 24px -4px rgba(0,0,0,0.55)'
          : '0 4px 18px -4px rgba(0,0,0,0.10)',
  overflow: 'hidden',
  backdropFilter: theme.palette.mode === 'dark' ? 'blur(26px) saturate(120%)' : 'blur(10px)',
  WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(26px) saturate(120%)' : 'blur(10px)',
        transition: 'all .35s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 14px 40px -6px rgba(0,0,0,0.65)'
            : '0 10px 32px -6px rgba(0,0,0,0.15)'
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 85% 15%, rgba(148,163,184,0.10), transparent 60%)'
            : 'radial-gradient(circle at 85% 15%, rgba(59,130,246,0.08), transparent 60%)',
          pointerEvents: 'none'
        }
      }}
    >
      <CardContent sx={{ p: 2.25, pt: 2, pb: 1.75, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              letterSpacing: '.75px',
              textTransform: 'uppercase',
              mb: 0.75,
              lineHeight: 1.05,
              opacity: 0.9
            }}
          >
            {label}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={140} height={44} />
          ) : (
            <Typography
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: dynamicFontSize,
                lineHeight: 1.02,
                letterSpacing: '-.5px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={String(value)}
            >
              {value}
            </Typography>
          )}
          <Avatar
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              // Colorful, yet subtle, glassy badge behind the icon
              background: theme.palette.mode === 'dark'
                ? `radial-gradient(60% 60% at 50% 45%, ${alpha(paletteColor.light || paletteColor.main, 0.22)} 0%, ${alpha(paletteColor.main, 0.12)} 35%, rgba(15,23,42,0.35) 100%)`
                : `radial-gradient(60% 60% at 50% 45%, ${alpha(paletteColor.light || paletteColor.main, 0.25)} 0%, ${alpha(paletteColor.main, 0.12)} 65%, rgba(255,255,255,0.9) 100%)`,
              width: 56,
              height: 56,
              border: `1px solid ${alpha(paletteColor.main, 0.45)}`,
              boxShadow: theme.palette.mode === 'dark'
                ? `inset 0 0 0 1px ${alpha('#ffffff', 0.04)}, 0 10px 22px -6px ${alpha(paletteColor.main, 0.55)}`
                : `0 8px 18px -6px ${alpha(paletteColor.main, 0.45)}`,
              backdropFilter: 'blur(4px)',
              zIndex: 1,
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                boxShadow: `inset 0 0 0 1px ${alpha(paletteColor.light || paletteColor.main, 0.55)}`,
                pointerEvents: 'none'
              }
            }}
          >
            {iconElement}
          </Avatar>
        </Box>
        <Box display="flex" alignItems="center" gap={1} mt={1} sx={{ minHeight: 26 }}>
          <Delta value={delta} />
          {children}
        </Box>
      </CardContent>
    </Card>
  );
};

export default KPIStat;
