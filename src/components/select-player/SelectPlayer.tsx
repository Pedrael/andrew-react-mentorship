import { useContext } from 'react';
import { GameContext } from '../../context/GameContext';

export default function SelectPlayer() {
  const game = useContext(GameContext);

  if (!game) {
    throw new Error('SelectPlayer must be used inside GameProvider');
  }

  const { players, selectPlayer } = game;

  return (
    <section>
      <h2>Select player</h2>
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            <button
              type="button"
              onClick={() => selectPlayer(player.id)}
              aria-pressed={player.isSelected}
              style={{
                fontWeight: player.isSelected ? 700 : 400,
                border: player.isSelected ? '2px solid #1976d2' : '1px solid #ccc',
                backgroundColor: player.isSelected ? '#e3f2fd' : '#fff',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: 6,
              }}
            >
              {player.name}
              {player.isSelected ? ' (selected)' : ''}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
