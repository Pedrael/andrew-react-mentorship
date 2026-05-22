import questionsJson from '../data/questions.json';

type Question = {
  price: number;
  question: string;
  answer: string;
  image?: string;
  isAnswered?: boolean;
};

type Category = {
  title: string;
  questions: Question[];
};

type QuestionsJsonShape = {
  categories: Category[];
};

type QuestionState = {
  categories: Category[];
};

export type QuestionAction = { type: 'addCategory' };

const CATEGORIES_STORAGE_KEY = 'jeopardy-categories';

export function loadInitialCategories(): Category[] {
  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Category[];
  } catch {
    // corrupted storage — fall back to the JSON file
  }
  return (questionsJson as QuestionsJsonShape | undefined)?.categories ?? [];
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
};

export default function questionReducer(
  state: QuestionState,
  action: QuestionAction,
): QuestionState {
  if (action.type === 'addCategory') return questionActions.addCategory(state);
  return state;
}
