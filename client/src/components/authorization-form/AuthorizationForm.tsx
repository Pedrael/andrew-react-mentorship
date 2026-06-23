import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { login, type TokenResponse } from '../../services/auth';
import type { ApiError } from '../../services/apiClient';
import ControllableTextField from '../controllable-text-field/ControllableTextField';

type AuthorizationFormProps = {
  onSuccess?: (token: TokenResponse) => void;
  title?: string;
};

type AuthorizationFormValues = {
  username: string;
  password: string;
};

export default function AuthorizationForm({
  onSuccess,
  title = 'Sign in',
}: AuthorizationFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    resetField,
    formState: { isSubmitting, isValid },
  } = useForm<AuthorizationFormValues>({
    defaultValues: { username: '', password: '' },
    mode: 'onChange',
  });

  const onSubmit = async ({ username, password }: AuthorizationFormValues) => {
    setError(null);
    try {
      const token = await login(username.trim(), password);
      resetField('password');
      onSuccess?.(token);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError?.message ?? 'Sign in failed');
    }
  };

  return (
    <Paper elevation={2} sx={{ maxWidth: 360, mx: 'auto', p: 3 }}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="on">
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ControllableTextField
            name="username"
            control={control}
            rules={{
              required: 'Username is required',
              validate: (value) => value.trim().length > 0 || 'Username is required',
            }}
            id="auth-username"
            label="Username"
            type="text"
            autoComplete="username"
            disabled={isSubmitting}
            fullWidth
            required
            placeholder="admin"
          />

          <ControllableTextField
            name="password"
            control={control}
            rules={{
              required: 'Password is required',
            }}
            id="auth-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            disabled={isSubmitting}
            fullWidth
            required
            placeholder="password"
          />

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !isValid}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
