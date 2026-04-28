import './App.css';
import JeopardyTable from './components/jeopardy-table/JeopardyTable';
import ScoreBoard from './components/score-board/ScoreBoard';
import SelectPlayer from './components/select-player/SelectPlayer';
import { GameProvider } from './context/GameContext';

function App() {
  return (
    <GameProvider>
      <section style={{ padding: 16 }}>
        <JeopardyTable />
        <SelectPlayer />
        <ScoreBoard />
      </section>
    </GameProvider>
  );
}

export default App;
