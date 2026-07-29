import { useCallback, useMemo } from 'react';
import {
  markQuestionAuctioned,
  setAuctionState,
  type AuctionState,
} from './gameUi.slice';
import { selectAuctionState } from './gameUi.selectors';
import { useAppDispatch, useAppSelector } from '../hooks';
import { selectPlayers } from '../players/players.selectors';
import { usePatchPlayerMutation } from '../players/players.api';
import type { Player } from '../players/players.types';

const ADMIN_SCORE_PENALTY = 100;

export type AuctionViewModel = {
  auctionActive: boolean;
  selectorPlayer: Player | null;
  auctionPlayers: Player[];
  activeBidders: Player[];
  currentBidder: Player | null;
  bids: Record<string, number>;
  wrongIds: Set<string>;
  maxBid: number;
};

type UseQuestionAuctionArgs = {
  questionKey: string | null;
  maxBid: number;
  isAdmin: boolean;
  finalize: (pointsWinner?: Player, points?: number) => void | Promise<void>;
  onMarkAuctioned?: (questionKey: string) => void;
  onAuctionUpdate?: (auction: AuctionState | null) => void;
};

export function useQuestionAuction({
  questionKey,
  maxBid,
  isAdmin,
  finalize,
  onMarkAuctioned,
  onAuctionUpdate,
}: UseQuestionAuctionArgs) {
  const dispatch = useAppDispatch();
  const players = useAppSelector(selectPlayers);
  const auction = useAppSelector(selectAuctionState);
  const [patchPlayer] = usePatchPlayerMutation();

  const auctionActive = Boolean(auction && questionKey && auction.questionKey === questionKey);
  const selectorPlayerId = auctionActive ? auction!.selectorPlayerId : null;

  const bids = useMemo(
    () => (auctionActive ? auction!.bids : {}),
    [auction, auctionActive],
  );
  const wrongIds = useMemo(
    () => new Set(auctionActive ? auction!.wrongPlayerIds : []),
    [auction, auctionActive],
  );

  const syncAuction = useCallback(
    (next: AuctionState | null) => {
      dispatch(setAuctionState(next));
      onAuctionUpdate?.(next);
    },
    [dispatch, onAuctionUpdate],
  );

  const selectorPlayer = useMemo(
    () =>
      selectorPlayerId ? (players.find((p) => p.id === selectorPlayerId) ?? null) : null,
    [players, selectorPlayerId],
  );

  const auctionPlayers = useMemo(
    () => (selectorPlayerId ? players.filter((p) => p.id !== selectorPlayerId) : []),
    [players, selectorPlayerId],
  );

  const activeBidders = useMemo(
    () =>
      auctionPlayers
        .filter((p) => (bids[p.id] ?? 0) > 0)
        .sort((a, b) => (bids[b.id] ?? 0) - (bids[a.id] ?? 0)),
    [auctionPlayers, bids],
  );

  const currentBidder = activeBidders.find((p) => !wrongIds.has(p.id)) ?? null;

  const viewModel: AuctionViewModel = {
    auctionActive,
    selectorPlayer,
    auctionPlayers,
    activeBidders,
    currentBidder,
    bids,
    wrongIds,
    maxBid,
  };

  const startAuction = useCallback(
    (selectedPlayer: Player) => {
      if (!questionKey) return;
      if (isAdmin) {
        void patchPlayer({
          id: selectedPlayer.id,
          payload: { score: selectedPlayer.score - ADMIN_SCORE_PENALTY },
        });
      }
      syncAuction({
        questionKey,
        selectorPlayerId: selectedPlayer.id,
        bids: {},
        wrongPlayerIds: [],
      });
      dispatch(markQuestionAuctioned(questionKey));
      onMarkAuctioned?.(questionKey);
    },
    [questionKey, isAdmin, patchPlayer, syncAuction, dispatch, onMarkAuctioned],
  );

  const handleBidChange = useCallback(
    (playerId: string, raw: string) => {
      if (!auctionActive || !auction) return;

      let nextBids: Record<string, number>;
      if (raw === '') {
        nextBids = { ...auction.bids };
        delete nextBids[playerId];
      } else {
        const parsed = Number.parseInt(raw, 10);
        if (Number.isNaN(parsed)) return;
        const clamped = Math.max(0, Math.min(maxBid, parsed));
        nextBids = { ...auction.bids, [playerId]: clamped };
      }

      syncAuction({ ...auction, bids: nextBids });
    },
    [auctionActive, auction, maxBid, syncAuction],
  );

  const handleAuctionCorrect = useCallback(
    (player: Player) => {
      const bid = bids[player.id] ?? 0;
      if (bid <= 0) return;
      void finalize(player, bid);
    },
    [bids, finalize],
  );

  const handleAuctionWrong = useCallback(
    (player: Player) => {
      const bid = bids[player.id] ?? 0;
      if (!questionKey || bid <= 0 || !auction) return;
      if (isAdmin) {
        void patchPlayer({
          id: player.id,
          payload: { score: player.score - bid },
        });
      }
      const nextWrongIds = [...auction.wrongPlayerIds, player.id];
      syncAuction({ ...auction, wrongPlayerIds: nextWrongIds });
      const stillCanAnswer = activeBidders.filter((p) => !nextWrongIds.includes(p.id));
      if (stillCanAnswer.length === 0) {
        void finalize();
      }
    },
    [bids, questionKey, auction, isAdmin, patchPlayer, syncAuction, activeBidders, finalize],
  );

  const handleEndAuctionWithoutBids = useCallback(() => {
    void finalize();
  }, [finalize]);

  const resetAuction = useCallback(() => {
    if (isAdmin) {
      syncAuction(null);
    }
  }, [isAdmin, syncAuction]);

  return {
    viewModel,
    startAuction,
    handleBidChange,
    handleAuctionCorrect,
    handleAuctionWrong,
    handleEndAuctionWithoutBids,
    resetAuction,
  };
}
