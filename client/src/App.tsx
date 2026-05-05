import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import PlayerLayout from './layouts/PlayerLayout';
import { GameProvider } from './context/GameContext';

function App() {
  return (
    <GameProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminLayout />} />
        <Route path="/player" element={<PlayerLayout />} />
      </Routes>
    </GameProvider>
  );
}

export default App;
