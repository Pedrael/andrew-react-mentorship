import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import QuestionDialog from '../question-dialog/QuestionDialog';
import type { QuestionDialogData } from '../question-dialog/QuestionDialog';
import questionsJson from '../../data/questions.json';

type Question = {
  price: number;
  question: string;
  image?: string;
  answer: string;
  isAnswered?: boolean;
};

type Category = {
  title: string;
  questions: Question[];
};

type QuestionsJsonShape = {
  categories: Category[];
};

type FlatQuestion = QuestionDialogData;

type JeopardyTableProps = {
  categories?: Category[];
  onQuestionClick?: (question: FlatQuestion) => void;
};

export default function JeopardyTable({ categories: categoriesProp }: JeopardyTableProps) {
  const [selectedQuestion, setSelectedQuestion] = React.useState<QuestionDialogData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState<boolean>(false);
  const [answeredQuestionKeys, setAnsweredQuestionKeys] = React.useState<Set<string>>(new Set());
  const dialogCloseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoriesData = React.useMemo(() => {
    const fromJson = (questionsJson as QuestionsJsonShape | undefined)?.categories ?? [];
    return categoriesProp ?? fromJson;
  }, [categoriesProp]);

  const categories = React.useMemo(() => {
    return categoriesData.map((category) => category.title);
  }, [categoriesData]);

  const prices = React.useMemo(() => {
    const seen = new Set<number>();
    const result: number[] = [];

    for (const category of categoriesData) {
      for (const q of category.questions) {
        if (seen.has(q.price)) continue;
        seen.add(q.price);
        result.push(q.price);
      }
    }

    result.sort((a, b) => a - b);
    return result;
  }, [categoriesData]);

  const questionMap = React.useMemo(() => {
    const map = new Map<string, QuestionDialogData>();

    for (const category of categoriesData) {
      for (const q of category.questions) {
        map.set(`${category.title}::${q.price}`, {
          ...q,
          category: category.title,
        });
      }
    }

    return map;
  }, [categoriesData]);

  React.useEffect(() => {
    const initiallyAnswered = new Set<string>();

    for (const category of categoriesData) {
      for (const question of category.questions) {
        if (question.isAnswered) {
          initiallyAnswered.add(`${category.title}::${question.price}`);
        }
      }
    }

    setAnsweredQuestionKeys(initiallyAnswered);
  }, [categoriesData]);

  const onCellClick = (cellData: QuestionDialogData) => {
    setSelectedQuestion(cellData);
    setIsDialogOpen(true);
  };

  const onDialogClose = () => {
    if (dialogCloseTimeoutRef.current) {
      clearTimeout(dialogCloseTimeoutRef.current);
    }

    dialogCloseTimeoutRef.current = setTimeout(() => {
      setSelectedQuestion(null);
      dialogCloseTimeoutRef.current = null;
    }, 100);

    setIsDialogOpen(false);
  };

  const onQuestionAnswered = (question: QuestionDialogData) => {
    setAnsweredQuestionKeys((prev) => {
      const next = new Set(prev);
      next.add(`${question.category}::${question.price}`);
      return next;
    });
  };

  React.useEffect(() => {
    return () => {
      if (dialogCloseTimeoutRef.current) {
        clearTimeout(dialogCloseTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <TableContainer component={Paper} sx={{ maxWidth: 1100 }}>
        <Table aria-label="Jeopardy board">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 180, fontWeight: 700 }}>Categories</TableCell>
              {prices.map((price) => (
                <TableCell key={price} align="center" sx={{ fontWeight: 700 }}>
                  {`$${price}`}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category}>
                <TableCell sx={{ fontWeight: 700 }}>{category}</TableCell>
                {prices.map((price) => {
                  const questionKey = `${category}::${price}`;
                  const cellQuestion: QuestionDialogData | undefined = questionMap.get(
                    questionKey,
                  );
                  const isDisabled =
                    !cellQuestion ||
                    Boolean(cellQuestion.isAnswered) ||
                    answeredQuestionKeys.has(questionKey);

                  return (
                    <TableCell
                      key={questionKey}
                      align="center"
                      sx={{
                        verticalAlign: 'top',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                        opacity: isDisabled ? 0.45 : 1,
                        cursor: isDisabled ? 'default' : 'pointer',
                        userSelect: 'none',
                        height: 64,
                        paddingTop: 1,
                        paddingBottom: 1,
                      }}
                      onClick={() => {
                        if (isDisabled || !cellQuestion) return;
                        onCellClick(cellQuestion);
                      }}
                    >
                      {cellQuestion?.price ?? ''}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <QuestionDialog
        question={selectedQuestion}
        isOpen={isDialogOpen}
        onClose={onDialogClose}
        onQuestionAnswered={onQuestionAnswered}
        disableBackdropClose
      />
    </>
  );
}
