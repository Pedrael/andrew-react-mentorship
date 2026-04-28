import { useGame } from '../../hooks/useGame';
export default function ScoreBoard() {
  const { players, resetScores } = useGame();
  return (
    <section>
      <h2>Players</h2>
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            {player.name}: {player.score}
          </li>
        ))}
      </ul>
      <button onClick={resetScores}>Reset scores</button>
    </section>
  );
}
