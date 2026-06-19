import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { type ChangeEvent, type Dispatch } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import type { GameAction, GameState } from '../../state/RootReducer';
import type { GameActions } from '../../hooks/useGameActions';

type PlayerManagementFormProps = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  actions: GameActions;
};

type AddPlayerFormValues = {
  playerName: string;
};

export default function PlayerManagementForm({
  state,
  dispatch,
  actions,
}: PlayerManagementFormProps) {
  const { players } = state;

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
    dispatch({ type: 'selectPlayer', payload: value });
  };

  const onAddPlayer = async ({ playerName }: AddPlayerFormValues) => {
    await actions.addPlayer(playerName.trim());
    reset();
  };

  const handleDeletePlayer = (playerId: string) => {
    void actions.deletePlayer(playerId);
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
                <IconButton onClick={() => handleDeletePlayer(player.id)}>
                  <ClearIcon />
                </IconButton>
              </Box>
            ))}
            <Controller
              name="playerName"
              control={control}
              rules={{
                required: 'Player name is required',
                validate: (value) =>
                  value.trim().length > 0 || 'Player name is required',
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id="playerName"
                  type="text"
                  disabled={isSubmitting}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              Add
            </Button>
          </Box>
        </RadioGroup>
      </FormControl>
    </Box>
  );
}
