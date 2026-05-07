import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputBase from '@mui/material/InputBase';
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
  onQuestionOpen?: (question: QuestionDialogData) => void;
  onQuestionClose?: () => void;
  onAnswerReveal?: (questionKey: string) => void;
  onQuestionLiveEdit?: (data: QuestionDialogData) => void;
};

export default function JeopardyTable({
  isAdmin = false,
  onQuestionOpen,
  onQuestionClose,
  onAnswerReveal,
  onQuestionLiveEdit,
}: JeopardyTableProps) {
  const game = React.useContext(GameContext);

  if (!game) {
    throw new Error('JeopardyTable must be used inside GameProvider');
  }

  const {
    categories: categoriesData,
    answeredQuestionKeys,
    auctionedQuestionKeys,
    addCategory,
    updateCategoryTitle,
    updateQuestion,
  } = game;

  const [selectedQuestion, setSelectedQuestion] = React.useState<QuestionDialogData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState<boolean>(false);
  const dialogCloseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Holds the save callback bound to the currently open cell's category index + price
  const questionSaverRef = React.useRef<
    ((data: { question: string; answer: string; image?: string }) => void) | null
  >(null);
  // Holds the live-edit callback that re-attaches category + price metadata
  const questionLiveEditRef = React.useRef<
    ((data: { question: string; answer: string; image?: string }) => void) | null
  >(null);

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

  // Only index questions that actually have content — empty slots are editable in admin mode
  const questionMap = React.useMemo(() => {
    const map = new Map<string, QuestionDialogData>();
    for (const category of categoriesData) {
      for (const q of category.questions) {
        if (!q.question) continue;
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

  const openDialog = (
    cellData: QuestionDialogData,
    categoryIndex: number,
    price: number,
  ) => {
    questionSaverRef.current = (data) => updateQuestion(categoryIndex, price, data);
    questionLiveEditRef.current = (data) => onQuestionLiveEdit?.({ ...cellData, ...data });
    setSelectedQuestion(cellData);
    setIsDialogOpen(true);
    if (isAdmin) onQuestionOpen?.(cellData);
  };

  const onDialogClose = () => {
    if (isAdmin) onQuestionClose?.();

    if (dialogCloseTimeoutRef.current) {
      clearTimeout(dialogCloseTimeoutRef.current);
    }

    dialogCloseTimeoutRef.current = setTimeout(() => {
      setSelectedQuestion(null);
      questionSaverRef.current = null;
      questionLiveEditRef.current = null;
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
                  ${price}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {categoriesData.map((cat, catIdx) => (
              <TableRow key={catIdx}>
                {/* Category title — editable TextField for admin */}
                <TableCell sx={{ fontWeight: 700, py: 0.5 }}>
                  {isAdmin ? (
                    <InputBase
                      value={cat.title}
                      onChange={(e) => updateCategoryTitle(catIdx, e.target.value)}
                      inputProps={{ 'aria-label': 'category name' }}
                      sx={{
                        fontWeight: 700,
                        fontSize: 'inherit',
                        width: '100%',
                        '& input': {
                          p: '4px 6px',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          '&:focus': { borderColor: 'primary.main', outline: 'none' },
                        },
                      }}
                    />
                  ) : (
                    cat.title
                  )}
                </TableCell>

                {prices.map((price) => {
                  const questionKey = buildQuestionKey(cat.title, price);
                  const cellQuestion = questionMap.get(questionKey);
                  const isAnswered = answeredQuestionKeys.has(questionKey);
                  const isAuctioned = auctionedQuestionKeys.has(questionKey);
                  const hasNoQuestion = !cellQuestion;
                  // Players can't interact with empty or answered cells
                  const isDisabled = isAnswered || (!isAdmin && hasNoQuestion);

                  return (
                    <TableCell
                      key={questionKey}
                      align="center"
                      sx={{
                        verticalAlign: 'middle',
                        opacity: !isAdmin && hasNoQuestion ? 0.35 : 1,
                        cursor: isDisabled ? 'default' : isAdmin ? 'pointer' : 'pointer',
                        userSelect: 'none',
                        height: 64,
                        py: 1,
                        backgroundColor: isAnswered
                          ? '#388e3c'
                          : isAuctioned
                            ? 'rgba(255, 193, 7, 0.15)'
                            : 'inherit',
                        color: isAnswered ? '#fff' : 'inherit',
                        // Subtle dashed border hint for empty admin cells
                        ...(isAdmin && hasNoQuestion && !isAnswered && {
                          color: 'text.disabled',
                        }),
                      }}
                      onClick={() => {
                        if (isAnswered) return;
                        if (!isAdmin && hasNoQuestion) return;
                        const dialogData: QuestionDialogData = cellQuestion ?? {
                          category: cat.title,
                          price,
                          question: '',
                          answer: '',
                        };
                        openDialog(dialogData, catIdx, price);
                      }}
                    >
                      {isAdmin && hasNoQuestion && !isAnswered ? (
                        <Box
                          component="span"
                          sx={{
                            fontSize: 18,
                            fontWeight: 300,
                            color: 'text.disabled',
                            lineHeight: 1,
                          }}
                        >
                          +
                        </Box>
                      ) : (
                        cellQuestion?.price ?? ''
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {isAdmin && (
        <Box sx={{ mt: 1 }}>
          <Button variant="outlined" onClick={addCategory} sx={{ borderStyle: 'dashed' }}>
            + Add category
          </Button>
        </Box>
      )}

      <QuestionDialog
        question={selectedQuestion}
        isAdmin={isAdmin}
        isOpen={isDialogOpen}
        onClose={onDialogClose}
        onAnswerReveal={onAnswerReveal}
        onQuestionSave={isAdmin ? (questionSaverRef.current ?? undefined) : undefined}
        onLiveEdit={isAdmin ? (questionLiveEditRef.current ?? undefined) : undefined}
        disableBackdropClose
      />
    </>
  );
}
