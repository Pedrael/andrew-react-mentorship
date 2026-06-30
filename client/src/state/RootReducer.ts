import playerReducer, {
  loadInitialPlayers,
  type PlayerAction,
  type Player,
} from './PlayerReducer.ts';
import questionReducer, {
  loadInitialCategories,
  loadInitialAnsweredKeys,
  loadInitialFailedKeys,
  type QuestionAction,
  type Category,
  type Question,
} from './QuestionReducer.ts';

export type { Player, Category, Question };

export type FlatQuestion = Question & {
  category: string;
};

export type GameState = {
  players: Player[];
  categories: Category[];
  answeredQuestionKeys: Set<string>;
  failedQuestionKeys: Set<string>;
  auctionedQuestionKeys: Set<string>;
  revealedQuestionKey: string | null;
};

export type GameAction = PlayerAction | QuestionAction;

const PLAYER_ACTION_TYPES = new Set<GameAction['type']>([
  'addPlayer',
  'deletePlayer',
  'addScore',
  'subtractScore',
  'resetScores',
  'selectPlayer',
  'selectNextPlayer',
  'syncPlayers',
]);

export function buildInitialState(): GameState {
  const categories = loadInitialCategories();
  return {
    players: loadInitialPlayers(),
    categories,
    answeredQuestionKeys: loadInitialAnsweredKeys(categories),
    failedQuestionKeys: loadInitialFailedKeys(categories),
    auctionedQuestionKeys: new Set<string>(),
    revealedQuestionKey: null,
  };
}

export const initialState: GameState = buildInitialState();

export function selectWinnerIfGameEnded(state: GameState): Player | null {
  if (
    state.categories.some((category) =>
      category.questions.some((question) => !question.isAnswered),
    )
  ) {
    return null;
  }
  if (state.players.length === 0) return null;
  return state.players.reduce(
    (max, player) => (player.score > max.score ? player : max),
    state.players[0],
  );
}

export function rootReducer(state: GameState, action: GameAction): GameState {
  if (PLAYER_ACTION_TYPES.has(action.type)) {
    const { players } = playerReducer({ players: state.players }, action as PlayerAction);
    return players === state.players ? state : { ...state, players };
  }

  const next = questionReducer(
    {
      categories: state.categories,
      answeredQuestionKeys: state.answeredQuestionKeys,
      failedQuestionKeys: state.failedQuestionKeys,
      auctionedQuestionKeys: state.auctionedQuestionKeys,
      revealedQuestionKey: state.revealedQuestionKey,
    },
    action as QuestionAction,
  );

  if (
    next.categories === state.categories &&
    next.answeredQuestionKeys === state.answeredQuestionKeys &&
    next.failedQuestionKeys === state.failedQuestionKeys &&
    next.auctionedQuestionKeys === state.auctionedQuestionKeys &&
    next.revealedQuestionKey === state.revealedQuestionKey
  ) {
    return state;
  }

  return { ...state, ...next };
}
