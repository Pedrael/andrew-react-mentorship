import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { AuctionPanelProps } from './types';

export default function AuctionPanel({
  isAdmin,
  isRevealingAnswer,
  auction,
  onBidChange,
  onAuctionCorrect,
  onAuctionWrong,
  onEndAuctionWithoutBids,
}: AuctionPanelProps) {
  const {
    selectorPlayer,
    auctionPlayers,
    activeBidders,
    currentBidder,
    bids,
    wrongIds,
    maxBid,
  } = auction;

  return (
    <Box>
      <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1 }}>
        ✗&nbsp;{selectorPlayer?.name ?? 'Player'} failed — auction open (max bid ${maxBid})
      </Typography>

      {isAdmin ? (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Enter bids for participating players (highest bid answers first).
          </Typography>

          {auctionPlayers.map((player) => {
            const bid = bids[player.id] ?? '';
            const answeredWrong = wrongIds.has(player.id);
            return (
              <Box
                key={player.id}
                sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}
              >
                <Typography variant="body2" sx={{ minWidth: 120 }}>
                  {player.name}
                  {answeredWrong ? ' (wrong)' : ''}
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  label="Bid"
                  value={bid}
                  onChange={(e) => onBidChange(player.id, e.target.value)}
                  disabled={answeredWrong || isRevealingAnswer}
                  slotProps={{
                    htmlInput: { min: 0, max: maxBid, step: 1 },
                  }}
                  sx={{ width: 100 }}
                />
              </Box>
            );
          })}
        </>
      ) : (
        auctionPlayers
          .filter((player) => (bids[player.id] ?? 0) > 0 || wrongIds.has(player.id))
          .map((player) => {
            const bid = bids[player.id] ?? 0;
            const answeredWrong = wrongIds.has(player.id);
            return (
              <Box key={player.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 120 }}>
                  {player.name}
                  {answeredWrong ? ' (wrong)' : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {bid > 0 ? `$${bid}` : '—'}
                </Typography>
              </Box>
            );
          })
      )}

      {activeBidders.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Answer order (highest bid first)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {activeBidders.map((player, index) => (
              <Typography
                key={player.id}
                variant="caption"
                sx={{
                  color: wrongIds.has(player.id)
                    ? 'error.main'
                    : player.id === currentBidder?.id
                      ? 'primary.main'
                      : 'text.secondary',
                  fontWeight: player.id === currentBidder?.id ? 700 : 400,
                }}
              >
                {index + 1}. {player.name} (${bids[player.id]})
                {wrongIds.has(player.id) ? ' ✗' : ''}
              </Typography>
            ))}
          </Box>
        </>
      )}

      {isAdmin && currentBidder && !isRevealingAnswer && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => onAuctionWrong(currentBidder)}
            sx={{ minWidth: 0 }}
          >
            ✗&nbsp;{currentBidder.name}&nbsp;wrong&nbsp;(−{bids[currentBidder.id]})
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => onAuctionCorrect(currentBidder)}
            sx={{ minWidth: 0 }}
          >
            ✓&nbsp;{currentBidder.name}&nbsp;correct&nbsp;+{bids[currentBidder.id]}
          </Button>
        </Box>
      )}

      {isAdmin && activeBidders.length === 0 && !isRevealingAnswer && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            No bids yet.
          </Typography>
          <Button variant="outlined" size="small" onClick={onEndAuctionWithoutBids}>
            End question (no bids)
          </Button>
        </Box>
      )}

      {!isAdmin && activeBidders.length === 0 && !isRevealingAnswer && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          No bids yet.
        </Typography>
      )}
    </Box>
  );
}
