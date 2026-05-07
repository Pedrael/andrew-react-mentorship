import { createContext, useCallback, useState, type ReactNode } from 'react';
import questionsJson from '../data/questions.json';

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
  image?: string;
  isAnswered?: boolean;
};

export type Category = {
  title: string;
  questions: Question[];
};

export type FlatQuestion = Question & {
  category: string;
};

type QuestionsJsonShape = {
  categories: Category[];
};

// eslint-disable-next-line react-refresh/only-export-components
export const buildQuestionKey = (categoryTitle: string, price: number) =>
  `${categoryTitle}::${price}`;

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
  categories: Category[];
  answeredQuestionKeys: Set<string>;
  auctionedQuestionKeys: Set<string>;
  markQuestionAnswered: (questionKey: string) => void;
  markQuestionAuctioned: (questionKey: string) => void;
  revealedQuestionKey: string | null;
  revealQuestionAnswer: (questionKey: string) => void;
  clearRevealedQuestionAnswer: () => void;
  revealWinnerOnGameEnd: () => Player | null;
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

const initialCategories: Category[] =
  (questionsJson as QuestionsJsonShape | undefined)?.categories ?? [];

const initialAnsweredKeys = new Set<string>();
for (const category of initialCategories) {
  for (const q of category.questions) {
    if (q.isAnswered) {
      initialAnsweredKeys.add(buildQuestionKey(category.title, q.price));
    }
  }
}

export function GameProvider({ children }: GameProviderProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [categories] = useState<Category[]>(initialCategories);
  const [answeredQuestionKeys, setAnsweredQuestionKeys] =
    useState<Set<string>>(initialAnsweredKeys);
  const [auctionedQuestionKeys, setAuctionedQuestionKeys] = useState<Set<string>>(new Set());
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
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % prevPlayers.length;
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
  const markQuestionAnswered = useCallback((questionKey: string) => {
    setAnsweredQuestionKeys((prev) => {
      if (prev.has(questionKey)) return prev;
      const next = new Set(prev);
      next.add(questionKey);
      return next;
    });
    setAuctionedQuestionKeys((prev) => {
      if (!prev.has(questionKey)) return prev;
      const next = new Set(prev);
      next.delete(questionKey);
      return next;
    });
  }, []);
  const markQuestionAuctioned = useCallback((questionKey: string) => {
    setAuctionedQuestionKeys((prev) => {
      if (prev.has(questionKey)) return prev;
      const next = new Set(prev);
      next.add(questionKey);
      return next;
    });
  }, []);

  const revealWinnerOnGameEnd = () => {
    if (categories.some((category) => category.questions.some((question) => !question.isAnswered)))
      return null;
    const winner = players.reduce(
      (max, player) => (player.score > max.score ? player : max),
      players[0],
    );
    return winner;
  };
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
        categories,
        answeredQuestionKeys,
        auctionedQuestionKeys,
        markQuestionAnswered,
        markQuestionAuctioned,
        revealedQuestionKey,
        revealQuestionAnswer,
        clearRevealedQuestionAnswer,
        revealWinnerOnGameEnd,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
