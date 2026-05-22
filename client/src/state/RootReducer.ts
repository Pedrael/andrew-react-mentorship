import playerReducer, { type PlayerAction } from './PlayerReducer.ts';
import questionReducer, { type QuestionAction, loadInitialCategories } from './QuestionReducer.ts';

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

export type GameState = {
  players: Player[];
  categories: Category[];
  answeredQuestionKeys: string[];
  auctionedQuestionKeys: string[];
  revealedQuestionKey: string | null;
};

export const initialState: GameState = {
  players: [],
  categories: loadInitialCategories(),
  answeredQuestionKeys: [],
  auctionedQuestionKeys: [],
  revealedQuestionKey: null,
};

export type GameAction = PlayerAction | QuestionAction;

export function rootReducer(state: GameState, action: GameAction): GameState {
  if (action.type === 'addPlayer' || action.type === 'deletePlayer') {
    return { ...state, ...playerReducer({ players: state.players }, action) };
  }
  if (action.type === 'addCategory') {
    return { ...state, ...questionReducer({ categories: state.categories }, action) };
  }
  return state;
}
