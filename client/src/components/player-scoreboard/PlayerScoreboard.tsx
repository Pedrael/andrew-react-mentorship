import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useGame } from '../../hooks/useGame';

export default function PlayerScoreboard() {
  const { players } = useGame();

  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <Box sx={{ mt: 3, maxWidth: 480 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        Scoreboard
      </Typography>

      <Box
        sx={{
          border: '1px solid #000',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {sorted.map((player, index) => {
          const isFirst = index === 0 && player.score > 0;
          const isLast = index === sorted.length - 1;

          return (
            <Box
              key={player.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2,
                py: 1.5,
                borderBottom: isLast ? 'none' : '1px solid #000',
                backgroundColor: isFirst ? 'rgba(204, 0, 0, 0.06)' : 'inherit',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  width: 24,
                  fontWeight: 700,
                  color: isFirst ? 'primary.main' : 'text.secondary',
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </Typography>

              <Typography variant="body1" sx={{ flex: 1, fontWeight: isFirst ? 700 : 400 }}>
                {player.name}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  color: player.score < 0 ? 'error.main' : 'text.primary',
                  minWidth: 56,
                  textAlign: 'right',
                }}
              >
                ${player.score}
              </Typography>
            </Box>
          );
        })}

        {players.length === 0 && (
          <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Waiting for players…
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
