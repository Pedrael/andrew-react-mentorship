import { useState, type FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { login, type TokenResponse } from '../../services/auth';
import type { ApiError } from '../../services/apiClient';

type AuthorizationFormProps = {
  onSuccess?: (token: TokenResponse) => void;
  title?: string;
};

export default function AuthorizationForm({
  onSuccess,
  title = 'Sign in',
}: AuthorizationFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError('Username and password are required');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const token = await login(username.trim(), password);
      setPassword('');
      onSuccess?.(token);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError?.message ?? 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ maxWidth: 360, mx: 'auto', p: 3 }}>
      <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="on">
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            id="auth-username"
            name="username"
            label="Username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isSubmitting}
            fullWidth
            required
          />

          <TextField
            id="auth-password"
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            fullWidth
            required
          />

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined
            }
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
