import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { displayFont, tokens } from '../../theme';
import { useAppSelector } from '../../state/hooks';
import { selectPlayers } from '../../state/players/players.selectors';

export default function PlayerScoreboard() {
  const players = useAppSelector(selectPlayers);
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        component="h2"
        sx={{
          fontSize: '0.72rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: tokens.textMuted,
          mb: 1.5,
        }}
      >
        Scoreboard
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sorted.map((player, index) => {
          const isLeader = index === 0 && player.score > 0;

          return (
            <Box
              key={player.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.25,
                borderRadius: '10px',
                border: `1px solid ${tokens.border}`,
                backgroundColor: isLeader ? tokens.elevated : tokens.surface,
                borderLeft: isLeader ? `3px solid ${tokens.accent}` : `3px solid transparent`,
                transition: 'background-color 160ms ease, border-color 160ms ease',
              }}
            >
              <Typography
                component="span"
                sx={{
                  width: 20,
                  fontFamily: displayFont,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: isLeader ? tokens.accentBright : tokens.textMuted,
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </Typography>

              <Typography
                component="span"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.95rem',
                  fontWeight: isLeader ? 700 : 500,
                  color: tokens.textPrimary,
                }}
              >
                {player.name}
              </Typography>

              <Typography
                component="span"
                sx={{
                  fontFamily: displayFont,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: player.score < 0 ? tokens.accentBright : tokens.textPrimary,
                  minWidth: 56,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {player.score < 0 ? `−$${Math.abs(player.score)}` : `$${player.score}`}
              </Typography>
            </Box>
          );
        })}

        {players.length === 0 && (
          <Box
            sx={{
              px: 2,
              py: 2.5,
              textAlign: 'center',
              borderRadius: '10px',
              border: `1px dashed rgba(255, 255, 255, 0.12)`,
            }}
          >
            <Typography variant="body2" sx={{ color: tokens.textMuted }}>
              Waiting for players…
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
