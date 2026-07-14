import { useEffect, useRef } from 'react';
import { buildQuestionKey, type AuctionState } from '../../state/game/gameUi.slice';
import { useAnswerFinalization } from '../../state/game/useAnswerFinalization';
import { useQuestionAuction } from '../../state/game/useQuestionAuction';
import { useAppSelector } from '../../state/hooks';
import { selectPlayers } from '../../state/players/players.selectors';
import { selectCategories } from '../../state/categories/categories.selectors';
import { usePatchCategoryQuestionMutation } from '../../state/categories/categories.api';
import QuestionDialog from './QuestionDialog';
import QuestionContent from './QuestionContent';
import AuctionPanel from './AuctionPanel';
import QuestionDialogActions from './QuestionDialogActions';
import { useQuestionEditor } from './useQuestionEditor';
import type { QuestionDialogData } from './types';

type QuestionDialogContainerProps = {
  question: QuestionDialogData | null;
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
  disableBackdropClose?: boolean;
  showAnswer?: boolean;
  onAnswerReveal?: (questionKey: string, outcome: 'correct' | 'failed') => void;
  onMarkAuctioned?: (questionKey: string) => void;
  onAuctionUpdate?: (auction: AuctionState | null) => void;
  onLiveEdit?: (data: QuestionDialogData) => void;
};

export default function QuestionDialogContainer({
  question,
  isAdmin = false,
  isOpen,
  onClose,
  disableBackdropClose = false,
  showAnswer = false,
  onAnswerReveal,
  onMarkAuctioned,
  onAuctionUpdate,
  onLiveEdit,
}: QuestionDialogContainerProps) {
  const players = useAppSelector(selectPlayers);
  const categories = useAppSelector(selectCategories);
  const [patchCategoryQuestion] = usePatchCategoryQuestionMutation();

  const selectedPlayer = players.find((p) => p.isSelected);
  const scoreDelta = question?.price ?? 0;
  const questionKey = question ? buildQuestionKey(question.categoryId, question.price) : null;
  const previousQuestionKeyRef = useRef<string | null>(null);

  const handleLiveEdit = onLiveEdit
    ? (data: { question: string; answer: string; image?: string }) => {
        if (!question) return;
        onLiveEdit({ ...question, ...data });
      }
    : undefined;

  const { control, editImage, getEditValues } = useQuestionEditor({
    question,
    isAdmin,
    onLiveEdit: handleLiveEdit,
  });

  const { finalize, isRevealingAnswer, winner, clearWinner, clearReveal } = useAnswerFinalization({
    questionKey,
    categoryId: question?.categoryId ?? null,
    price: question?.price ?? null,
    isAdmin,
    onAnswerReveal,
    onAuctionUpdate,
  });

  const {
    viewModel: auction,
    startAuction,
    handleBidChange,
    handleAuctionCorrect,
    handleAuctionWrong,
    handleEndAuctionWithoutBids,
    resetAuction,
  } = useQuestionAuction({
    questionKey,
    maxBid: scoreDelta,
    isAdmin,
    finalize,
    onMarkAuctioned,
    onAuctionUpdate,
  });

  useEffect(() => {
    if (!isOpen || !questionKey) {
      clearReveal();
      resetAuction();
      clearWinner();
      previousQuestionKeyRef.current = questionKey;
      return;
    }

    if (previousQuestionKeyRef.current && previousQuestionKeyRef.current !== questionKey) {
      clearReveal();
      resetAuction();
      clearWinner();
    }

    previousQuestionKeyRef.current = questionKey;
  }, [isOpen, questionKey, clearReveal, resetAuction, clearWinner]);

  const closeDialog = () => {
    if (isAdmin && question) {
      const edited = getEditValues();
      const categoryIndex = categories.findIndex((c) => c.id === question.categoryId);
      if (categoryIndex !== -1) {
        void patchCategoryQuestion({
          index: categoryIndex,
          price: question.price,
          payload: {
            question: edited.question,
            answer: edited.answer,
            image: edited.image ?? null,
          },
        });
      }
    }
    clearReveal();
    onClose();
  };

  const handleCorrect = () => {
    if (!selectedPlayer) return;
    void finalize(selectedPlayer, scoreDelta);
  };

  const handleFail = () => {
    if (!selectedPlayer) return;
    startAuction(selectedPlayer);
  };

  return (
    <QuestionDialog
      question={question}
      isOpen={isOpen}
      onClose={closeDialog}
      disableBackdropClose={disableBackdropClose}
      actions={
        isAdmin ? (
          <QuestionDialogActions
            auctionActive={auction.auctionActive}
            selectedPlayer={selectedPlayer}
            scoreDelta={scoreDelta}
            isRevealingAnswer={isRevealingAnswer}
            hasQuestion={Boolean(question)}
            onFail={handleFail}
            onCorrect={handleCorrect}
            onClose={closeDialog}
          />
        ) : undefined
      }
    >
      <QuestionContent
        isAdmin={isAdmin}
        question={question}
        showAnswer={showAnswer}
        isRevealingAnswer={isRevealingAnswer}
        control={control}
        editImage={editImage}
        winner={winner}
      />

      {auction.auctionActive && (
        <AuctionPanel
          isAdmin={isAdmin}
          isRevealingAnswer={isRevealingAnswer}
          auction={auction}
          onBidChange={handleBidChange}
          onAuctionCorrect={handleAuctionCorrect}
          onAuctionWrong={handleAuctionWrong}
          onEndAuctionWithoutBids={handleEndAuctionWithoutBids}
        />
      )}
    </QuestionDialog>
  );
}
