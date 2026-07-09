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
