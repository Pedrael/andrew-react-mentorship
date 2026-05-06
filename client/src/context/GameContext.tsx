import { createContext, useCallback, useState, type ReactNode } from 'react';

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
  addPlayer: (player: Player) => void;
  deletePlayer: (playerId: string) => void;
  findSelectedPlayer: (playerId: string) => Player | undefined;
  addScore: (playerId: string, points: number) => void;
  subtractScore: (playerId: string, points: number) => void;
  resetScores: () => void;
  selectPlayer: (playerId: string) => void;
  selectNextPlayer: () => void;
  revealedQuestionKey: string | null;
  revealQuestionAnswer: (questionKey: string) => void;
  clearRevealedQuestionAnswer: () => void;
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
    isSelected: true,
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
  const [revealedQuestionKey, setRevealedQuestionKey] = useState<string | null>(null);
  const addPlayer = (player: Player) => {
    setPlayers((prevPlayers) => [...prevPlayers, player]);
  };

  const deletePlayer = (playerId: string) => {
    setPlayers((prevPlayers) => prevPlayers.filter((player) => player.id !== playerId));
  };

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
  const selectNextPlayer = useCallback(() => {
    setPlayers((prevPlayers) => {
      if (prevPlayers.length === 0) return prevPlayers;
      const currentIndex = prevPlayers.findIndex((player) => player.isSelected);
      const nextIndex =
        currentIndex === -1 ? 0 : (currentIndex + 1) % prevPlayers.length;
      return prevPlayers.map((player, index) => ({
        ...player,
        isSelected: index === nextIndex,
      }));
    });
  }, []);
  const revealQuestionAnswer = useCallback((questionKey: string) => {
    setRevealedQuestionKey(questionKey);
  }, []);
  const clearRevealedQuestionAnswer = useCallback(() => {
    setRevealedQuestionKey(null);
  }, []);
  return (
    <GameContext.Provider
      value={{
        players,
        addPlayer,
        deletePlayer,
        findSelectedPlayer,
        addScore,
        subtractScore,
        resetScores,
        selectPlayer,
        selectNextPlayer,
        revealedQuestionKey,
        revealQuestionAnswer,
        clearRevealedQuestionAnswer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
