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
import { displayFont, tokens } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { selectPlayers } from '../../state/players/players.selectors';
import { useCreatePlayerMutation, useDeletePlayerMutation } from '../../state/players/players.api';
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
        <FormLabel
          id="player-management-label"
          sx={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: tokens.textMuted,
            mb: 1.5,
          }}
        >
          Players
        </FormLabel>
        <RadioGroup
          aria-labelledby="player-management-label"
          name="player-management"
          value={selectedPlayerId}
          onChange={handleChange}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {players.map((player) => (
              <Box
                key={player.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 0.5,
                  pl: 0.5,
                  pr: 0.5,
                  py: 0.25,
                  borderRadius: '10px',
                  border: `1px solid ${player.isSelected ? tokens.accentBorder : tokens.border}`,
                  backgroundColor: player.isSelected ? tokens.accentTint : tokens.surface,
                  transition: 'background-color 140ms ease, border-color 140ms ease',
                }}
              >
                <FormControlLabel
                  value={player.id}
                  control={<Radio size="small" />}
                  sx={{ flex: 1, minWidth: 0, mr: 0 }}
                  label={
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'baseline',
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: player.isSelected ? 700 : 500,
                          fontSize: '0.9rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {player.name}
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: displayFont,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: player.score < 0 ? tokens.accentBright : tokens.textSecondary,
                          fontVariantNumeric: 'tabular-nums',
                          flexShrink: 0,
                        }}
                      >
                        {player.score < 0 ? `−$${Math.abs(player.score)}` : `$${player.score}`}
                      </Typography>
                    </Box>
                  }
                />
                <IconButton
                  size="small"
                  aria-label={`remove ${player.name}`}
                  onClick={() => void handleDeletePlayer(player.id)}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <ControllableTextField
                name="playerName"
                control={control}
                rules={{
                  required: 'Player name is required',
                  validate: (value) => value.trim().length > 0 || 'Player name is required',
                }}
                id="playerName"
                type="text"
                size="small"
                placeholder="Player name"
                disabled={isSubmitting || isCreating}
                sx={{ flex: 1 }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || isCreating}
                sx={{ flexShrink: 0, alignSelf: 'flex-start' }}
              >
                Add
              </Button>
            </Box>
          </Box>
        </RadioGroup>
      </FormControl>
    </Box>
  );
}
