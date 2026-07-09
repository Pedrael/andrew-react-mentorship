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
import { buildQuestionKey } from '../../state/game/gameUi.slice';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { selectCategories } from '../../state/categories/categories.selectors';
import {
  selectAnsweredKeys,
  selectAuctionedKeys,
  selectFailedKeys,
} from '../../state/game/gameUi.selectors';
import {
  categoriesApi,
  useCreateCategoryMutation,
  usePatchCategoryMutation,
  usePatchCategoryQuestionMutation,
} from '../../state/categories/categories.api';

type JeopardyTableProps = {
  isAdmin: boolean;
  onQuestionOpen?: (question: QuestionDialogData) => void;
  onQuestionClose?: () => void;
  onAnswerReveal?: (questionKey: string, outcome: 'correct' | 'failed') => void;
  onMarkAuctioned?: (questionKey: string) => void;
  onQuestionLiveEdit?: (data: QuestionDialogData) => void;
};

export default function JeopardyTable({
  isAdmin = false,
  onQuestionOpen,
  onQuestionClose,
  onAnswerReveal,
  onMarkAuctioned,
  onQuestionLiveEdit,
}: JeopardyTableProps) {
  const dispatch = useAppDispatch();
  const categoriesData = useAppSelector(selectCategories);
  const answeredQuestionKeys = useAppSelector(selectAnsweredKeys);
  const failedQuestionKeys = useAppSelector(selectFailedKeys);
  const auctionedQuestionKeys = useAppSelector(selectAuctionedKeys);
  const [createCategory] = useCreateCategoryMutation();
  const [patchCategory] = usePatchCategoryMutation();
  const [patchCategoryQuestion] = usePatchCategoryQuestionMutation();

  const [selected, setSelected] = React.useState<{
    data: QuestionDialogData;
    categoryIndex: number;
    price: number;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState<boolean>(false);
  const dialogCloseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save is only wired for the admin board (see the QuestionDialog props below).
  const handleQuestionSave = React.useCallback(
    (data: { question: string; answer: string; image?: string }) => {
      if (!selected) return;
      void patchCategoryQuestion({
        index: selected.categoryIndex,
        price: selected.price,
        payload: { question: data.question, answer: data.answer, image: data.image ?? null },
      });
    },
    [selected, patchCategoryQuestion],
  );

  const handleQuestionLiveEdit = React.useCallback(
    (data: { question: string; answer: string; image?: string }) => {
      if (!selected) return;
      onQuestionLiveEdit?.({ ...selected.data, ...data });
    },
    [selected, onQuestionLiveEdit],
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
        if (!q.question) continue;
        map.set(buildQuestionKey(category.id, q.price), {
          categoryId: category.id,
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

  // Persisted per-question outcome (survives refresh); the gameUi Sets below
  // are the live overlay for the current session.
  const persistedOutcomes = React.useMemo(() => {
    const answered = new Set<string>();
    const failed = new Set<string>();
    for (const category of categoriesData) {
      for (const q of category.questions) {
        if (!q.isAnswered) continue;
        const key = buildQuestionKey(category.id, q.price);
        if (q.answeredCorrectly === false) failed.add(key);
        else answered.add(key);
      }
    }
    return { answered, failed };
  }, [categoriesData]);

  const openDialog = (cellData: QuestionDialogData, categoryIndex: number, price: number) => {
    setSelected({ data: cellData, categoryIndex, price });
    setIsDialogOpen(true);
    if (isAdmin) onQuestionOpen?.(cellData);
  };

  const onDialogClose = () => {
    if (isAdmin) onQuestionClose?.();

    if (dialogCloseTimeoutRef.current) {
      clearTimeout(dialogCloseTimeoutRef.current);
    }

    // Keep the question mounted briefly so the dialog can animate out.
    dialogCloseTimeoutRef.current = setTimeout(() => {
      setSelected(null);
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
                <TableCell sx={{ fontWeight: 700, py: 0.5 }}>
                  {isAdmin ? (
                    <InputBase
                      value={cat.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        dispatch(
                          categoriesApi.util.updateQueryData('getCategories', undefined, (draft) => {
                            const category = draft[catIdx];
                            if (category) category.title = newTitle;
                          }),
                        );
                      }}
                      onBlur={(e) => {
                        void patchCategory({ index: catIdx, payload: { title: e.target.value } });
                      }}
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
                  const questionKey = buildQuestionKey(cat.id, price);
                  const cellQuestion = questionMap.get(questionKey);
                  const isAnsweredCorrectly =
                    answeredQuestionKeys.has(questionKey) || persistedOutcomes.answered.has(questionKey);
                  const isAnsweredFailed =
                    failedQuestionKeys.has(questionKey) || persistedOutcomes.failed.has(questionKey);
                  const isClosed = isAnsweredCorrectly || isAnsweredFailed;
                  const isAuctioned = auctionedQuestionKeys.has(questionKey);
                  const hasNoQuestion = !cellQuestion;
                  const isDisabled = isClosed || (!isAdmin && hasNoQuestion);

                  return (
                    <TableCell
                      key={questionKey}
                      align="center"
                      sx={{
                        verticalAlign: 'middle',
                        opacity: !isAdmin && hasNoQuestion ? 0.35 : 1,
                        cursor: isDisabled ? 'default' : 'pointer',
                        userSelect: 'none',
                        height: 64,
                        py: 1,
                        backgroundColor: isAnsweredCorrectly
                          ? '#388e3c'
                          : isAnsweredFailed
                            ? '#c62828'
                            : isAuctioned
                              ? 'rgba(255, 193, 7, 0.15)'
                              : 'inherit',
                        color: isClosed ? '#fff' : 'inherit',
                        ...(isAdmin &&
                          hasNoQuestion &&
                          !isClosed && {
                            color: 'text.disabled',
                          }),
                      }}
                      onClick={() => {
                        if (isClosed) return;
                        if (!isAdmin && hasNoQuestion) return;
                        const dialogData: QuestionDialogData = cellQuestion ?? {
                          categoryId: cat.id,
                          category: cat.title,
                          price,
                          question: '',
                          answer: '',
                        };
                        openDialog(dialogData, catIdx, price);
                      }}
                    >
                      {isAdmin && hasNoQuestion && !isClosed ? (
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
                        (cellQuestion?.price ?? '')
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
          <Button
            variant="outlined"
            onClick={() => void createCategory()}
            sx={{ borderStyle: 'dashed' }}
          >
            + Add category
          </Button>
        </Box>
      )}

      <QuestionDialog
        question={selected?.data ?? null}
        isAdmin={isAdmin}
        isOpen={isDialogOpen}
        onClose={onDialogClose}
        onAnswerReveal={onAnswerReveal}
        onMarkAuctioned={onMarkAuctioned}
        onQuestionSave={isAdmin ? handleQuestionSave : undefined}
        onLiveEdit={isAdmin ? handleQuestionLiveEdit : undefined}
        disableBackdropClose
      />
    </>
  );
}
