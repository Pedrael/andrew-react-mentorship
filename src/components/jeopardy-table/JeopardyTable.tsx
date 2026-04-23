import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import questionsJson from '../../data/questions.json';
import QuestionDialog from './QuestionDialog';

type Question = {
  category: string;
  question: string;
  price: number;
};

type JeopardyTableProps = {
  questions?: Question[];
  onQuestionClick?: (question: Question) => void;
};

export default function JeopardyTable({ questions, onQuestionClick }: JeopardyTableProps) {
  const [selectedQuestion, setSelectedQuestion] = React.useState<Question | null>(null);
  type QuestionsJsonShape = { questions: Question[] };

  const questionList = React.useMemo(() => {
    const fromJson = (questionsJson as QuestionsJsonShape | undefined)?.questions ?? [];
    return questions ?? fromJson;
  }, [questions]);

  // Preserve first-seen order for categories.
  const categories = React.useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const q of questionList) {
      if (seen.has(q.category)) continue;
      seen.add(q.category);
      result.push(q.category);
    }
    return result;
  }, [questionList]);

  // Header cells are the prices (sorted numerically).
  const prices = React.useMemo(() => {
    const seen = new Set<number>();
    const result: number[] = [];
    for (const q of questionList) {
      if (seen.has(q.price)) continue;
      seen.add(q.price);
      result.push(q.price);
    }
    result.sort((a, b) => a - b);
    return result;
  }, [questionList]);

  const questionMap = React.useMemo(() => {
    const map = new Map<string, Question>();
    for (const q of questionList) {
      map.set(`${q.category}::${q.price}`, q);
    }
    return map;
  }, [questionList]);

  function handleCellClick(question: Question | undefined, isDisabled: boolean) {
    if (!question || isDisabled) return;
    setSelectedQuestion(question);
    onQuestionClick?.(question);
  }

  function handleCloseModal() {
    setSelectedQuestion(null);
  }

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
                  const q = questionMap.get(`${category}::${price}`);
                  const isDisabled = !q;

                  return (
                    <TableCell
                      key={`${category}::${price}`}
                      align="center"
                      sx={{
                        verticalAlign: 'top',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                        opacity: isDisabled ? 0.45 : 1,
                        cursor: isDisabled ? 'default' : 'pointer',
                        userSelect: 'none',
                        // Gives each clue cell a consistent "board" feel.
                        height: 64,
                        paddingTop: 1,
                        paddingBottom: 1,
                      }}
                      onClick={() => handleCellClick(q, isDisabled)}
                    >
                    {q ? `$${price}` : ''}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <QuestionDialog question={selectedQuestion} onClose={handleCloseModal} />
    </>
  );
}
