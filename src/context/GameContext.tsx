import { createContext, useState, type ReactNode } from 'react';

export type Player = {
  id: string;
  name: string;
  score: number;
  isSelected: boolean;
};

export type Question = {
  price: number;
  question: string;
  answer: string;
};

export type Category = {
  title: string;
  questions: Question[];
};

export type FlatQuestion = Question & {
  category: string;
};

export type GameContextValue = {
  players: Player[];
  findSelectedPlayer: (playerId: string) => Player | undefined;
  addScore: (playerId: string, points: number) => void;
  subtractScore: (playerId: string, points: number) => void;
  resetScores: () => void;
  selectPlayer: (playerId: string) => void;
};

type GameProviderProps = {
  children: ReactNode;
};

// eslint-disable-next-line react-refresh/only-export-components
export const GameContext = createContext<GameContextValue | null>(null);
const initialPlayers: Player[] = [
  {
    id: 'player-1',
    name: 'Player 1',
    score: 0,
    isSelected: false,
  },
  {
    id: 'player-2',
    name: 'Player 2',
    score: 0,
    isSelected: false,
  },
];

export function GameProvider({ children }: GameProviderProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const addScore = (playerId: string, points: number) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === playerId
          ? {
              ...player,
              score: player.score + points,
            }
          : player,
      ),
    );
  };
  const subtractScore = (playerId: string, points: number) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === playerId
          ? {
              ...player,
              score: player.score - points,
            }
          : player,
      ),
    );
  };
  const resetScores = () => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => ({
        ...player,
        score: 0,
      })),
    );
  };
  const selectPlayer = (playerId: string) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === playerId
          ? {
              ...player,
              isSelected: true,
            }
          : {
              ...player,
              isSelected: false,
            },
      ),
    );
  };
  const findSelectedPlayer = (playerId: string) => {
    return players.find((player) => player.id === playerId);
  };
  return (
    <GameContext.Provider
      value={{
        players,
        findSelectedPlayer,
        addScore,
        subtractScore,
        resetScores,
        selectPlayer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
