import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useLoginMutation, type TokenResponse } from '../../state/auth/auth.api';
import ControllableTextField from '../controllable-text-field/ControllableTextField';

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null) {
      const body = data as { error_description?: string; message?: string; error?: string };
      return body.error_description ?? body.message ?? body.error ?? 'Sign in failed';
    }
  }
  return 'Sign in failed';
}

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
  const [login, { isLoading: isSubmitting }] = useLoginMutation();

  const {
    control,
    handleSubmit,
    resetField,
    formState: { isValid },
  } = useForm<AuthorizationFormValues>({
    defaultValues: { username: '', password: '' },
    mode: 'onChange',
  });

  const onSubmit = async ({ username, password }: AuthorizationFormValues) => {
    setError(null);
    try {
      const token = await login({ username: username.trim(), password }).unwrap();
      resetField('password');
      onSuccess?.(token);
    } catch (err) {
      setError(getErrorMessage(err));
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
