import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const STATUS_MAP = {
  0: { key: 'created', label: 'Created' },
  1: { key: 'paid', label: 'Paid' },
  2: { key: 'disputed', label: 'Disputed' },
  3: { key: 'resolved', label: 'Resolved' },
  4: { key: 'cancelled', label: 'Cancelled' },
  created: { key: 'created', label: 'Created' },
  paid: { key: 'paid', label: 'Paid' },
  disputed: { key: 'disputed', label: 'Disputed' },
  resolved: { key: 'resolved', label: 'Resolved' },
  cancelled: { key: 'cancelled', label: 'Cancelled' },
  overdue: { key: 'overdue', label: 'Overdue' },
};

export const StatusChip = ({ status, size = 'small', variant = 'auto' }) => {
  const theme = useTheme();
  const raw = STATUS_MAP[status] || { key: 'unknown', label: 'Unknown' };
  const paletteEntry = theme.palette.status?.[raw.key];
  const colorStyles = paletteEntry
    ? {
        bgcolor: variant === 'outlined' ? 'transparent' : paletteEntry.main,
        color: variant === 'outlined' ? paletteEntry.main : paletteEntry.contrastText,
        border: `1px solid ${paletteEntry.main}`,
      }
    : {
        bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.subtle : theme.palette.background.paper,
        color: theme.palette.text.secondary,
        border: `1px solid ${theme.palette.divider}`,
      };
  const autoVariant = variant === 'auto' ? (['paid','resolved'].includes(raw.key) ? 'filled' : 'outlined') : variant;

  return (
    <Tooltip title={`Invoice status: ${raw.label}`} arrow>
      <Chip
        size={size}
        label={raw.label}
        variant={autoVariant === 'filled' ? 'filled' : 'outlined'}
        sx={{
          fontWeight: 600,
          textTransform: 'none',
          ...colorStyles,
          '&.MuiChip-outlined': {
            background: 'transparent'
          }
        }}
      />
    </Tooltip>
  );
};

export default StatusChip;
