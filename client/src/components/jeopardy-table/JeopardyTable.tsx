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
import type { QuestionDialogData } from '../question-dialog/types';
import { displayFont, tokens } from '../../theme';
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
} from '../../state/categories/categories.api';

type JeopardyTableProps = {
  isAdmin: boolean;
  onQuestionOpen?: (question: QuestionDialogData) => void;
};

export default function JeopardyTable({ isAdmin = false, onQuestionOpen }: JeopardyTableProps) {
  const dispatch = useAppDispatch();
  const categoriesData = useAppSelector(selectCategories);
  const answeredQuestionKeys = useAppSelector(selectAnsweredKeys);
  const failedQuestionKeys = useAppSelector(selectFailedKeys);
  const auctionedQuestionKeys = useAppSelector(selectAuctionedKeys);
  const [createCategory] = useCreateCategoryMutation();
  const [patchCategory] = usePatchCategoryMutation();

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

  return (
    <>
      <TableContainer component={Paper} sx={{ width: '100%' }}>
        <Table aria-label="Jeopardy board">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 200 }}>Categories</TableCell>
              {prices.map((price) => (
                <TableCell key={price} align="center">
                  ${price}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {categoriesData.map((cat, catIdx) => (
              <TableRow key={catIdx}>
                <TableCell
                  sx={{
                    fontFamily: displayFont,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: tokens.textPrimary,
                    backgroundColor: tokens.sunken,
                    textAlign: 'left',
                    px: 1.5,
                    py: 0.5,
                  }}
                >
                  {isAdmin ? (
                    <InputBase
                      value={cat.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        dispatch(
                          categoriesApi.util.updateQueryData(
                            'getCategories',
                            undefined,
                            (draft) => {
                              const category = draft[catIdx];
                              if (category) category.title = newTitle;
                            },
                          ),
                        );
                      }}
                      onBlur={(e) => {
                        void patchCategory({ index: catIdx, payload: { title: e.target.value } });
                      }}
                      inputProps={{ 'aria-label': 'category name' }}
                      sx={{
                        fontFamily: displayFont,
                        fontWeight: 700,
                        fontSize: 'inherit',
                        color: 'inherit',
                        width: '100%',
                        '& input': {
                          p: '4px 6px',
                          border: '1px solid transparent',
                          borderRadius: 1,
                          transition: 'border-color 120ms ease, background-color 120ms ease',
                          '&:hover': { borderColor: tokens.borderStrong },
                          '&:focus': {
                            borderColor: tokens.accentBorder,
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            outline: 'none',
                          },
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
                    answeredQuestionKeys.has(questionKey) ||
                    persistedOutcomes.answered.has(questionKey);
                  const isAnsweredFailed =
                    failedQuestionKeys.has(questionKey) ||
                    persistedOutcomes.failed.has(questionKey);
                  const isClosed = isAnsweredCorrectly || isAnsweredFailed;
                  const isAuctioned = auctionedQuestionKeys.has(questionKey);
                  const hasNoQuestion = !cellQuestion;
                  // Players: board is view-only (opens only via admin broadcast).
                  // Admin: can open any non-closed cell (including empty to create).
                  const isDisabled = isClosed || !isAdmin;

                  const isEmptyAddCell = isAdmin && hasNoQuestion && !isClosed;

                  return (
                    <TableCell
                      key={questionKey}
                      align="center"
                      sx={{
                        verticalAlign: 'middle',
                        cursor: isDisabled ? 'default' : 'pointer',
                        userSelect: 'none',
                        height: 64,
                        py: 1,
                        transition:
                          'background-color 140ms ease, box-shadow 140ms ease, transform 140ms ease',
                        // Tile surfaces: closed tiles recede, live tiles read as game pieces
                        backgroundColor: isClosed
                          ? tokens.sunken
                          : isEmptyAddCell
                            ? 'transparent'
                            : hasNoQuestion
                              ? tokens.sunken
                              : tokens.surface,
                        // Status shown as thin accent borders, never full fills
                        boxShadow: isAnsweredCorrectly
                          ? `inset 0 0 0 1px rgba(63, 181, 107, 0.45)`
                          : isAnsweredFailed
                            ? `inset 0 0 0 1px rgba(245, 50, 63, 0.4)`
                            : isAuctioned
                              ? `inset 0 0 0 1px rgba(224, 163, 46, 0.5)`
                              : 'none',
                        ...(isEmptyAddCell && {
                          border: `1px dashed rgba(255, 255, 255, 0.12)`,
                          color: tokens.textMuted,
                          '&:hover': {
                            borderColor: tokens.accentBorder,
                            color: tokens.accentBright,
                            backgroundColor: tokens.accentTint,
                          },
                        }),
                        ...(!isDisabled &&
                          !isEmptyAddCell && {
                            '&:hover': {
                              backgroundColor: tokens.elevated,
                              boxShadow: `inset 0 0 0 1px ${tokens.accentBorder}, 0 0 16px rgba(224, 30, 43, 0.18)`,
                              transform: 'translateY(-1px)',
                            },
                          }),
                      }}
                      onClick={() => {
                        if (isClosed || !isAdmin) return;
                        const dialogData: QuestionDialogData = cellQuestion ?? {
                          categoryId: cat.id,
                          category: cat.title,
                          price,
                          question: '',
                          answer: '',
                        };
                        onQuestionOpen?.(dialogData);
                      }}
                    >
                      {isClosed ? (
                        <Box
                          component="span"
                          aria-label={
                            isAnsweredCorrectly ? 'answered correctly' : 'answered incorrectly'
                          }
                          sx={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: isAnsweredCorrectly ? tokens.green : tokens.accentBright,
                            opacity: 0.75,
                            lineHeight: 1,
                          }}
                        >
                          {isAnsweredCorrectly ? '✓' : '✗'}
                        </Box>
                      ) : isEmptyAddCell ? (
                        <Box
                          component="span"
                          sx={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: 'inherit',
                            lineHeight: 1,
                          }}
                        >
                          + Add question
                        </Box>
                      ) : (
                        cellQuestion && (
                          <Box
                            component="span"
                            sx={{
                              fontFamily: displayFont,
                              fontWeight: 700,
                              fontSize: '1.2rem',
                              color: tokens.textPrimary,
                              lineHeight: 1,
                            }}
                          >
                            ${cellQuestion.price}
                          </Box>
                        )
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
        <Box sx={{ mt: 1.5 }}>
          <Button variant="outlined" size="small" onClick={() => void createCategory()}>
            + Add category
          </Button>
        </Box>
      )}
    </>
  );
}
