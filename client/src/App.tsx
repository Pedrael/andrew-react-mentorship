import { useState, type ReactNode } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AdminLayout from './layouts/AdminLayout';
import PlayerLayout from './layouts/PlayerLayout';
import AuthorizationForm from './components/authorization-form/AuthorizationForm';
import { isAuthenticated } from './services/authStorage';
import { displayFont, tokens } from './theme';

function RequireAuth({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      />
      <Route
        path="/player"
        element={
          <RequireAuth>
            <PlayerLayout />
          </RequireAuth>
        }
      />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(isAuthenticated());

  if (authed) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <Box
      component="section"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        p: 4,
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          component="span"
          sx={{
            fontFamily: displayFont,
            fontWeight: 800,
            fontSize: '1.6rem',
            color: tokens.textPrimary,
          }}
        >
          Krasty
          <Box component="span" sx={{ color: tokens.accent }}>
            Soft
          </Box>
        </Typography>
        <Typography
          sx={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: tokens.textMuted,
            mt: 0.5,
          }}
        >
          Jeopardy
        </Typography>
      </Box>
      <AuthorizationForm
        onSuccess={() => {
          setAuthed(true);
          navigate('/admin', { replace: true });
        }}
      />
    </Box>
  );
}

export default App;
