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

export type QuestionState = {
  categories: Category[];
  answeredQuestionKeys: Set<string>;
  auctionedQuestionKeys: Set<string>;
  revealedQuestionKey: string | null;
};

export type QuestionAction =
  | { type: 'addCategory' }
  | { type: 'updateCategoryTitle'; payload: { index: number; newTitle: string } }
  | {
      type: 'updateQuestion';
      payload: {
        categoryIndex: number;
        price: number;
        data: { question: string; answer: string; image?: string };
      };
    }
  | { type: 'syncCategories'; payload: Category[] }
  | { type: 'markQuestionAnswered'; payload: string }
  | { type: 'markQuestionAuctioned'; payload: string }
  | { type: 'revealQuestionAnswer'; payload: string }
  | { type: 'clearRevealedQuestionAnswer' };

export const buildQuestionKey = (categoryTitle: string, price: number) =>
  `${categoryTitle}::${price}`;

export function loadInitialCategories(): Category[] {
  return [];
}

export function loadInitialAnsweredKeys(_categories: Category[]): Set<string> {
  return new Set<string>();
}

const questionActions = {
  addCategory: (state: QuestionState): QuestionState => {
    const priceSet = new Set<number>();
    for (const cat of state.categories) {
      for (const q of cat.questions) priceSet.add(q.price);
    }
    const prices = [...priceSet].sort((a, b) => a - b);
    return {
      ...state,
      categories: [
        ...state.categories,
        {
          title: `Category ${state.categories.length + 1}`,
          questions: prices.map((price) => ({
            price,
            question: '',
            answer: '',
            isAnswered: false,
          })),
        },
      ],
    };
  },
  updateCategoryTitle: (state: QuestionState, index: number, newTitle: string): QuestionState => ({
    ...state,
    categories: state.categories.map((cat, i) => (i === index ? { ...cat, title: newTitle } : cat)),
  }),
  updateQuestion: (
    state: QuestionState,
    categoryIndex: number,
    price: number,
    data: { question: string; answer: string; image?: string },
  ): QuestionState => {
    const cat = state.categories[categoryIndex];
    if (!cat) return state;
    const qIdx = cat.questions.findIndex((q) => q.price === price);
    const updated = [...state.categories];
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
    return { ...state, categories: updated };
  },
  syncCategories: (state: QuestionState, categories: Category[]): QuestionState => ({
    ...state,
    categories,
  }),
  markQuestionAnswered: (state: QuestionState, questionKey: string): QuestionState => {
    const alreadyAnswered = state.answeredQuestionKeys.has(questionKey);
    const wasAuctioned = state.auctionedQuestionKeys.has(questionKey);
    if (alreadyAnswered && !wasAuctioned) return state;
    const answeredQuestionKeys = alreadyAnswered
      ? state.answeredQuestionKeys
      : new Set(state.answeredQuestionKeys).add(questionKey);
    let auctionedQuestionKeys = state.auctionedQuestionKeys;
    if (wasAuctioned) {
      auctionedQuestionKeys = new Set(state.auctionedQuestionKeys);
      auctionedQuestionKeys.delete(questionKey);
    }
    return { ...state, answeredQuestionKeys, auctionedQuestionKeys };
  },
  markQuestionAuctioned: (state: QuestionState, questionKey: string): QuestionState => {
    if (state.auctionedQuestionKeys.has(questionKey)) return state;
    const auctionedQuestionKeys = new Set(state.auctionedQuestionKeys);
    auctionedQuestionKeys.add(questionKey);
    return { ...state, auctionedQuestionKeys };
  },
  revealQuestionAnswer: (state: QuestionState, questionKey: string): QuestionState => ({
    ...state,
    revealedQuestionKey: questionKey,
  }),
  clearRevealedQuestionAnswer: (state: QuestionState): QuestionState => ({
    ...state,
    revealedQuestionKey: null,
  }),
};

export default function questionReducer(
  state: QuestionState,
  action: QuestionAction,
): QuestionState {
  switch (action.type) {
    case 'addCategory':
      return questionActions.addCategory(state);
    case 'updateCategoryTitle':
      return questionActions.updateCategoryTitle(
        state,
        action.payload.index,
        action.payload.newTitle,
      );
    case 'updateQuestion':
      return questionActions.updateQuestion(
        state,
        action.payload.categoryIndex,
        action.payload.price,
        action.payload.data,
      );
    case 'syncCategories':
      return questionActions.syncCategories(state, action.payload);
    case 'markQuestionAnswered':
      return questionActions.markQuestionAnswered(state, action.payload);
    case 'markQuestionAuctioned':
      return questionActions.markQuestionAuctioned(state, action.payload);
    case 'revealQuestionAnswer':
      return questionActions.revealQuestionAnswer(state, action.payload);
    case 'clearRevealedQuestionAnswer':
      return questionActions.clearRevealedQuestionAnswer(state);
    default:
      return state;
  }
}
