import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Question = {
  price: number;
  question: string;
  answer: string;
  image?: string;
  isAnswered?: boolean;
  answeredCorrectly?: boolean;
};

export type Category = {
  title: string;
  questions: Question[];
};

export type QuestionState = {
  categories: Category[];
  answeredQuestionKeys: Set<string>;
  failedQuestionKeys: Set<string>;
  auctionedQuestionKeys: Set<string>;
  revealedQuestionKey: string | null;
};

export const buildQuestionKey = (categoryTitle: string, price: number) =>
  `${categoryTitle}::${price}`;

const initialState: QuestionState = {
  categories: [],
  answeredQuestionKeys: new Set<string>(),
  failedQuestionKeys: new Set<string>(),
  auctionedQuestionKeys: new Set<string>(),
  revealedQuestionKey: null,
};

const questionSlice = createSlice({
  name: 'question',
  initialState,
  reducers: {
    addCategory: (state) => {
      const priceSet = new Set<number>();
      for (const cat of state.categories) {
        for (const q of cat.questions) priceSet.add(q.price);
      }
      const prices = [...priceSet].sort((a, b) => a - b);
      state.categories.push({
        title: `Category ${state.categories.length + 1}`,
        questions: prices.map((price) => ({
          price,
          question: '',
          answer: '',
          isAnswered: false,
        })),
      });
    },
    updateCategoryTitle: (
      state,
      action: PayloadAction<{ index: number; newTitle: string }>,
    ) => {
      const cat = state.categories[action.payload.index];
      if (cat) cat.title = action.payload.newTitle;
    },
    updateQuestion: (
      state,
      action: PayloadAction<{
        categoryIndex: number;
        price: number;
        data: { question: string; answer: string; image?: string };
      }>,
    ) => {
      const { categoryIndex, price, data } = action.payload;
      const cat = state.categories[categoryIndex];
      if (!cat) return;
      const qIdx = cat.questions.findIndex((q) => q.price === price);
      if (qIdx === -1) {
        cat.questions.push({ price, ...data, isAnswered: false });
      } else {
        Object.assign(cat.questions[qIdx], data);
      }
    },
    syncCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
    markQuestionAnswered: (state, action: PayloadAction<string>) => {
      const questionKey = action.payload;
      const alreadyAnswered = state.answeredQuestionKeys.has(questionKey);
      const wasAuctioned = state.auctionedQuestionKeys.has(questionKey);
      if (alreadyAnswered && !wasAuctioned) return;
      if (!alreadyAnswered) state.answeredQuestionKeys.add(questionKey);
      state.failedQuestionKeys.delete(questionKey);
      if (wasAuctioned) state.auctionedQuestionKeys.delete(questionKey);
    },
    markQuestionFailed: (state, action: PayloadAction<string>) => {
      const questionKey = action.payload;
      if (state.failedQuestionKeys.has(questionKey)) return;
      state.failedQuestionKeys.add(questionKey);
      state.answeredQuestionKeys.delete(questionKey);
      state.auctionedQuestionKeys.delete(questionKey);
    },
    markQuestionAuctioned: (state, action: PayloadAction<string>) => {
      const questionKey = action.payload;
      if (!state.auctionedQuestionKeys.has(questionKey)) {
        state.auctionedQuestionKeys.add(questionKey);
      }
    },
    revealQuestionAnswer: (state, action: PayloadAction<string>) => {
      state.revealedQuestionKey = action.payload;
    },
    clearRevealedQuestionAnswer: (state) => {
      state.revealedQuestionKey = null;
    },
  },
});

export const {
  addCategory,
  updateCategoryTitle,
  updateQuestion,
  syncCategories,
  markQuestionAnswered,
  markQuestionFailed,
  markQuestionAuctioned,
  revealQuestionAnswer,
  clearRevealedQuestionAnswer,
} = questionSlice.actions;

export default questionSlice.reducer;
