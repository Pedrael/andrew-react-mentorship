import { useReducer, useState, type ReactNode } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import PlayerLayout from './layouts/PlayerLayout';
import AuthorizationForm from './components/authorization-form/AuthorizationForm';
import { buildInitialState, rootReducer } from './state/RootReducer';
import { isAuthenticated } from './services/authStorage';

function RequireAuth({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  const [state, dispatch] = useReducer(rootReducer, undefined, buildInitialState);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout state={state} dispatch={dispatch} />
          </RequireAuth>
        }
      />
      <Route
        path="/player"
        element={
          <RequireAuth>
            <PlayerLayout state={state} dispatch={dispatch} />
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
    <section style={{ padding: 32 }}>
      <AuthorizationForm
        onSuccess={() => {
          setAuthed(true);
          navigate('/admin', { replace: true });
        }}
      />
    </section>
  );
}

export default App;
