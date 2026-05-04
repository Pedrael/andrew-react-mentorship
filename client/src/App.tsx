import './App.css';
import JeopardyTable from './components/jeopardy-table/JeopardyTable';
import PlayerManagementForm from './components/player-management-form/PlayerManagementForm';

import { GameProvider } from './context/GameContext';

function App() {
  return (
    <GameProvider>
      <section style={{ padding: 16 }}>
        <JeopardyTable />
        <PlayerManagementForm />
      </section>
    </GameProvider>
  );
}

export default App;
