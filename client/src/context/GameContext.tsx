import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
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
  addCategory: () => void;
  updateCategoryTitle: (index: number, newTitle: string) => void;
  updateQuestion: (
    categoryIndex: number,
    price: number,
    data: { question: string; answer: string; image?: string },
  ) => void;
  answeredQuestionKeys: Set<string>;
  auctionedQuestionKeys: Set<string>;
  markQuestionAnswered: (questionKey: string) => void;
  markQuestionAuctioned: (questionKey: string) => void;
  revealedQuestionKey: string | null;
  revealQuestionAnswer: (questionKey: string) => void;
  clearRevealedQuestionAnswer: () => void;
  revealWinnerOnGameEnd: () => Player | null;
  syncPlayers: (data: Array<{ id: string; name: string; score: number }>) => void;
  syncCategories: (cats: Category[]) => void;
};

type GameProviderProps = {
  children: ReactNode;
};

// eslint-disable-next-line react-refresh/only-export-components
export const GameContext = createContext<GameContextValue | null>(null);

const CATEGORIES_STORAGE_KEY = 'jeopardy-categories';
const PLAYERS_STORAGE_KEY = 'jeopardy-players';
const ANSWERED_STORAGE_KEY = 'jeopardy-answered';

function loadInitialCategories(): Category[] {
  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Category[];
  } catch {
    // corrupted storage — fall back to the JSON file
  }
  return (questionsJson as QuestionsJsonShape | undefined)?.categories ?? [];
}

function loadInitialPlayers(): Player[] {
  try {
    const stored = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Player[];
  } catch {
    // corrupted storage — fall back to defaults
  }
  return defaultPlayers;
}

const defaultPlayers: Player[] = [
  { id: 'player-1', name: 'Player 1', score: 0, isSelected: true },
  { id: 'player-2', name: 'Player 2', score: 0, isSelected: false },
];

const initialCategories: Category[] = loadInitialCategories();
const initialPlayers: Player[] = loadInitialPlayers();

function loadInitialAnsweredKeys(): Set<string> {
  try {
    const stored = localStorage.getItem(ANSWERED_STORAGE_KEY);
    if (stored) return new Set<string>(JSON.parse(stored) as string[]);
  } catch {
    // corrupted storage — derive from categories as fallback
  }
  const keys = new Set<string>();
  for (const category of initialCategories) {
    for (const q of category.questions) {
      if (q.isAnswered) keys.add(buildQuestionKey(category.title, q.price));
    }
  }
  return keys;
}

const initialAnsweredKeys = loadInitialAnsweredKeys();

export function GameProvider({ children }: GameProviderProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);  const [categories, setCategories] = useState<Category[]>(initialCategories);

  // Persist categories to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch {
      // storage quota exceeded — ignore
    }
  }, [categories]);

  // Persist players to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
    } catch {
      // storage quota exceeded — ignore
    }
  }, [players]);

  const [answeredQuestionKeys, setAnsweredQuestionKeys] =
    useState<Set<string>>(initialAnsweredKeys);

  // Persist answered question keys to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(ANSWERED_STORAGE_KEY, JSON.stringify([...answeredQuestionKeys]));
    } catch {
      // storage quota exceeded — ignore
    }
  }, [answeredQuestionKeys]);
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
  const addCategory = useCallback(() => {
    setCategories((prev) => {
      const priceSet = new Set<number>();
      for (const cat of prev) {
        for (const q of cat.questions) priceSet.add(q.price);
      }
      const prices = [...priceSet].sort((a, b) => a - b);
      return [
        ...prev,
        {
          title: `Category ${prev.length + 1}`,
          questions: prices.map((price) => ({ price, question: '', answer: '', isAnswered: false })),
        },
      ];
    });
  }, []);

  const updateCategoryTitle = useCallback((index: number, newTitle: string) => {
    setCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, title: newTitle } : cat)),
    );
  }, []);

  const updateQuestion = useCallback(
    (
      categoryIndex: number,
      price: number,
      data: { question: string; answer: string; image?: string },
    ) => {
      setCategories((prev) => {
        const updated = [...prev];
        const cat = updated[categoryIndex];
        if (!cat) return prev;
        const qIdx = cat.questions.findIndex((q) => q.price === price);
        if (qIdx === -1) {
          updated[categoryIndex] = {
            ...cat,
            questions: [...cat.questions, { price, ...data, isAnswered: false }],
          };
        } else {
          const questions = [...cat.questions];
          questions[qIdx] = { ...questions[qIdx], ...data };
          updated[categoryIndex] = { ...cat, questions };
        }
        return updated;
      });
    },
    [],
  );

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

  const syncPlayers = useCallback(
    (data: Array<{ id: string; name: string; score: number }>) => {
      setPlayers((prev) =>
        data.map((p) => {
          const existing = prev.find((ep) => ep.id === p.id);
          return { id: p.id, name: p.name, score: p.score, isSelected: existing?.isSelected ?? false };
        }),
      );
    },
    [],
  );

  const revealWinnerOnGameEnd = () => {
    if (categories.some((category) => category.questions.some((question) => !question.isAnswered)))
      return null;
    const winner = players.reduce(
      (max, player) => (player.score > max.score ? player : max),
      players[0],
    );
    return winner;
  };
  const syncCategories = useCallback((cats: Category[]) => {
    setCategories(cats);
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
        categories,
        addCategory,
        updateCategoryTitle,
        updateQuestion,
        answeredQuestionKeys,
        auctionedQuestionKeys,
        markQuestionAnswered,
        markQuestionAuctioned,
        revealedQuestionKey,
        revealQuestionAnswer,
        clearRevealedQuestionAnswer,
        revealWinnerOnGameEnd,
        syncPlayers,
        syncCategories,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
