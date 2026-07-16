import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { displayFont, tokens } from '../../theme';
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
  const { selectorPlayer, auctionPlayers, activeBidders, currentBidder, bids, wrongIds, maxBid } =
    auction;

  return (
    <Box
      sx={{
        borderTop: `1px solid ${tokens.border}`,
        pt: 2,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mb: 1.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: tokens.amber,
        }}
      >
        ✗&nbsp;{selectorPlayer?.name ?? 'Player'} failed — auction open (max bid ${maxBid})
      </Typography>

      {isAdmin ? (
        <>
          <Typography
            variant="caption"
            sx={{ display: 'block', mb: 1, color: tokens.textSecondary }}
          >
            Enter bids for participating players (highest bid answers first).
          </Typography>

          {auctionPlayers.map((player) => {
            const bid = bids[player.id] ?? '';
            const answeredWrong = wrongIds.has(player.id);
            return (
              <Box key={player.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    minWidth: 120,
                    color: answeredWrong ? tokens.textMuted : tokens.textPrimary,
                  }}
                >
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
                <Typography
                  variant="body2"
                  sx={{
                    minWidth: 120,
                    color: answeredWrong ? tokens.textMuted : tokens.textPrimary,
                  }}
                >
                  {player.name}
                  {answeredWrong ? ' (wrong)' : ''}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: displayFont,
                    fontWeight: 700,
                    color: bid > 0 ? tokens.textPrimary : tokens.textMuted,
                  }}
                >
                  {bid > 0 ? `$${bid}` : '—'}
                </Typography>
              </Box>
            );
          })
      )}

      {activeBidders.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 1,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: tokens.textMuted,
            }}
          >
            Answer order (highest bid first)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
            {activeBidders.map((player, index) => {
              const isCurrent = player.id === currentBidder?.id;
              const isWrong = wrongIds.has(player.id);
              return (
                <Typography
                  key={player.id}
                  variant="caption"
                  sx={{
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 999,
                    lineHeight: 1.2,
                    border: `1px solid ${
                      isWrong
                        ? 'rgba(245, 50, 63, 0.4)'
                        : isCurrent
                          ? tokens.accentBorder
                          : tokens.border
                    }`,
                    backgroundColor: isCurrent ? tokens.accentTint : tokens.surface,
                    color: isWrong
                      ? tokens.accentBright
                      : isCurrent
                        ? tokens.textPrimary
                        : tokens.textSecondary,
                    fontWeight: isCurrent ? 700 : 500,
                  }}
                >
                  {index + 1}. {player.name} (${bids[player.id]}){isWrong ? ' ✗' : ''}
                </Typography>
              );
            })}
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
          <Typography
            variant="caption"
            sx={{ display: 'block', mb: 1, color: tokens.textSecondary }}
          >
            No bids yet.
          </Typography>
          <Button variant="outlined" size="small" onClick={onEndAuctionWithoutBids}>
            End question (no bids)
          </Button>
        </Box>
      )}

      {!isAdmin && activeBidders.length === 0 && !isRevealingAnswer && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: tokens.textSecondary }}>
          No bids yet.
        </Typography>
      )}
    </Box>
  );
}
