import type { Control } from 'react-hook-form';
import type { Player } from '../../state/players/players.types';
import type { AuctionViewModel } from '../../state/game/useQuestionAuction';

export type { AuctionViewModel };

export type QuestionDialogData = {
  categoryId: string;
  category: string;
  question: string;
  price: number;
  answer: string;
  image?: string;
};

export type QuestionEditValues = {
  question: string;
  answer: string;
  image: string;
};

export type QuestionContentProps = {
  isAdmin: boolean;
  question: QuestionDialogData | null;
  showAnswer: boolean;
  isRevealingAnswer: boolean;
  control: Control<QuestionEditValues>;
  editImage: string;
  winner: Player | null;
};

export type AuctionPanelProps = {
  isAdmin: boolean;
  isRevealingAnswer: boolean;
  auction: AuctionViewModel;
  onBidChange: (playerId: string, raw: string) => void;
  onAuctionCorrect: (player: Player) => void;
  onAuctionWrong: (player: Player) => void;
  onEndAuctionWithoutBids: () => void;
};

export type QuestionDialogActionsProps = {
  auctionActive: boolean;
  selectedPlayer: Player | undefined;
  scoreDelta: number;
  isRevealingAnswer: boolean;
  hasQuestion: boolean;
  onFail: () => void;
  onCorrect: () => void;
  onClose: () => void;
};
