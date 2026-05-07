import { useGame } from '../../hooks/useGame';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function PlayerScoreboard() {
  const { players } = useGame();

  return (
    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {players.map((player) => (
        <Box
          key={player.id}
          sx={{
            border: 1,
            borderColor: player.isSelected ? 'primary.main' : '#000',
            borderRadius: 1,
            px: 1.5,
            py: 1,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography>{player.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Score: {player.score}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
