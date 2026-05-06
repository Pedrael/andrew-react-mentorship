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
import { GameContext, buildQuestionKey } from '../../context/GameContext';

type JeopardyTableProps = {
  isAdmin: boolean;
};

export default function JeopardyTable({ isAdmin = false }: JeopardyTableProps) {
  const game = React.useContext(GameContext);

  if (!game) {
    throw new Error('JeopardyTable must be used inside GameProvider');
  }

  const { categories: categoriesData, answeredQuestionKeys, auctionedQuestionKeys } = game;

  const [selectedQuestion, setSelectedQuestion] = React.useState<QuestionDialogData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState<boolean>(false);
  const dialogCloseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const categories = React.useMemo(
    () => categoriesData.map((category) => category.title),
    [categoriesData],
  );

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
        map.set(buildQuestionKey(category.title, q.price), {
          category: category.title,
          price: q.price,
          question: q.question,
          answer: q.answer,
          image: q.image,
        });
      }
    }

    return map;
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
                  const questionKey = buildQuestionKey(category, price);
                  const cellQuestion: QuestionDialogData | undefined = questionMap.get(questionKey);
                  const isAuctioned = auctionedQuestionKeys.has(questionKey);
                  const isDisabled = !cellQuestion || answeredQuestionKeys.has(questionKey);

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
                        backgroundColor: isAuctioned ? 'rgba(255, 193, 7, 0.15)' : 'inherit',
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
        isAdmin={isAdmin}
        isOpen={isDialogOpen}
        onClose={onDialogClose}
        disableBackdropClose
      />
    </>
  );
}
