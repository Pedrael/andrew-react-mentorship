import { useEffect, useReducer } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import PlayerLayout from './layouts/PlayerLayout';
import AuthorizationForm from './components/authorization-form/AuthorizationForm';
import { buildInitialState, rootReducer } from './state/RootReducer';

const CATEGORIES_STORAGE_KEY = 'jeopardy-categories';
const PLAYERS_STORAGE_KEY = 'jeopardy-players';
const ANSWERED_STORAGE_KEY = 'jeopardy-answered';

function App() {
  const [state, dispatch] = useReducer(rootReducer, undefined, buildInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(state.categories));
    } catch {
      // storage quota exceeded — ignore
    }
  }, [state.categories]);

  useEffect(() => {
    try {
      localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(state.players));
    } catch {
      // storage quota exceeded — ignore
    }
  }, [state.players]);

  useEffect(() => {
    try {
      localStorage.setItem(
        ANSWERED_STORAGE_KEY,
        JSON.stringify([...state.answeredQuestionKeys]),
      );
    } catch {
      // storage quota exceeded — ignore
    }
  }, [state.answeredQuestionKeys]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<AdminLayout state={state} dispatch={dispatch} />} />
      <Route path="/player" element={<PlayerLayout state={state} dispatch={dispatch} />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  return (
    <section style={{ padding: 32 }}>
      <AuthorizationForm onSuccess={() => navigate('/admin')} />
    </section>
  );
}

export default App;
