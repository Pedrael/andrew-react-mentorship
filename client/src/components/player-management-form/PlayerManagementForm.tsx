import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import { type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import ControllableTextField from '../controllable-text-field/ControllableTextField';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { selectPlayers } from '../../state/players/players.selectors';
import {
  useCreatePlayerMutation,
  useDeletePlayerMutation,
} from '../../state/players/players.api';
import { clearSelectedPlayerIfDeleted, selectPlayer } from '../../state/game/gameUi.slice';

type AddPlayerFormValues = {
  playerName: string;
};

export default function PlayerManagementForm() {
  const dispatch = useAppDispatch();
  const players = useAppSelector(selectPlayers);
  const [createPlayer, { isLoading: isCreating }] = useCreatePlayerMutation();
  const [deletePlayer] = useDeletePlayerMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AddPlayerFormValues>({
    defaultValues: { playerName: '' },
  });

  const selectedPlayerId = players.find((player) => player.isSelected)?.id ?? '';

  const handleChange = (_event: ChangeEvent<HTMLInputElement>, value: string) => {
    dispatch(selectPlayer(value));
  };

  const onAddPlayer = async ({ playerName }: AddPlayerFormValues) => {
    const trimmed = playerName.trim();
    if (!trimmed) return;
    await createPlayer({ name: trimmed });
    reset();
  };

  const handleDeletePlayer = async (playerId: string) => {
    dispatch(clearSelectedPlayerIfDeleted(playerId));
    await deletePlayer(playerId);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onAddPlayer)} noValidate autoComplete="off">
      <FormControl fullWidth>
        <FormLabel id="player-management-label">Players</FormLabel>
        <RadioGroup
          aria-labelledby="player-management-label"
          name="player-management"
          value={selectedPlayerId}
          onChange={handleChange}
        >
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
                <FormControlLabel
                  value={player.id}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography>{player.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Score: {player.score}
                      </Typography>
                    </Box>
                  }
                />
                <IconButton onClick={() => void handleDeletePlayer(player.id)}>
                  <ClearIcon />
                </IconButton>
              </Box>
            ))}
            <ControllableTextField
              name="playerName"
              control={control}
              rules={{
                required: 'Player name is required',
                validate: (value) => value.trim().length > 0 || 'Player name is required',
              }}
              id="playerName"
              type="text"
              disabled={isSubmitting || isCreating}
            />
            <Button type="submit" variant="contained" disabled={isSubmitting || isCreating}>
              Add
            </Button>
          </Box>
        </RadioGroup>
      </FormControl>
    </Box>
  );
}
