/** Mirrors the client Redux state shapes under `client/src/state/`. */
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
  answeredCorrectly?: boolean;
};

export type Category = {
  id: string;
  title: string;
  questions: Question[];
};

export type CategoriesFile = {
  categories: Category[];
};
