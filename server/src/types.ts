/**
 * Mirrors the client shapes in `client/src/context/GameContext.tsx`
 * and `client/src/state/GameReducer.tsx`.
 */
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

export type CategoriesFile = {
  categories: Category[];
};
