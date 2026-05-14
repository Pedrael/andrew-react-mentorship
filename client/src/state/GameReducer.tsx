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

export type GameState = {
  players: Player[];
  categories: Category[];
  answeredQuestionKeys: string[];
  auctionedQuestionKeys: string[];
  revealedQuestionKey: string | null;
};

const CATEGORIES_STORAGE_KEY = 'jeopardy-categories';

function loadInitialCategories(): Category[] {
  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Category[];
  } catch {
    // corrupted storage — fall back to the JSON file
  }
  return (questionsJson as QuestionsJsonShape | undefined)?.categories ?? [];
}

export const initialState: GameState = {
  players: [],
  categories: loadInitialCategories(),
  answeredQuestionKeys: [],
  auctionedQuestionKeys: [],
  revealedQuestionKey: null,
};

const actions = {
  addPlayer: (state: GameState, player: Player) => ({
    ...state,
    players: [...state.players, player],
  }),
  deletePlayer: (state: GameState, playerId: string) => ({
    ...state,
    players: state.players.filter((player) => player.id !== playerId),
  }),
};

export type GameAction =
  | { type: 'addPlayer'; payload: Player }
  | { type: 'deletePlayer'; payload: string };

export function reducer(state: GameState, action: GameAction): GameState {
  if (action.type === 'addPlayer') return actions.addPlayer(state, action.payload);
  if (action.type === 'deletePlayer') return actions.deletePlayer(state, action.payload);
  return state;
}
