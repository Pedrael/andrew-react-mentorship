export type Player = {
  id: string;
  name: string;
  score: number;
  isSelected: boolean;
};

export type PlayerState = {
  players: Player[];
};

export type PlayerAction =
  | { type: 'addPlayer'; payload: Player }
  | { type: 'deletePlayer'; payload: string }
  | { type: 'addScore'; payload: { playerId: string; points: number } }
  | { type: 'subtractScore'; payload: { playerId: string; points: number } }
  | { type: 'resetScores' }
  | { type: 'selectPlayer'; payload: string }
  | { type: 'selectNextPlayer' }
  | { type: 'syncPlayers'; payload: Array<{ id: string; name: string; score: number }> };

export function loadInitialPlayers(): Player[] {
  return [];
}

const playerActions = {
  addPlayer: (state: PlayerState, player: Player): PlayerState => ({
    ...state,
    players: [...state.players, player],
  }),
  deletePlayer: (state: PlayerState, playerId: string): PlayerState => ({
    ...state,
    players: state.players.filter((player) => player.id !== playerId),
  }),
  addScore: (state: PlayerState, playerId: string, points: number): PlayerState => ({
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? { ...player, score: player.score + points } : player,
    ),
  }),
  subtractScore: (state: PlayerState, playerId: string, points: number): PlayerState => ({
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? { ...player, score: player.score - points } : player,
    ),
  }),
  resetScores: (state: PlayerState): PlayerState => ({
    ...state,
    players: state.players.map((player) => ({ ...player, score: 0 })),
  }),
  selectPlayer: (state: PlayerState, playerId: string): PlayerState => ({
    ...state,
    players: state.players.map((player) => ({
      ...player,
      isSelected: player.id === playerId,
    })),
  }),
  selectNextPlayer: (state: PlayerState): PlayerState => {
    if (state.players.length === 0) return state;
    const currentIndex = state.players.findIndex((player) => player.isSelected);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % state.players.length;
    return {
      ...state,
      players: state.players.map((player, index) => ({
        ...player,
        isSelected: index === nextIndex,
      })),
    };
  },
  syncPlayers: (
    state: PlayerState,
    data: Array<{ id: string; name: string; score: number }>,
  ): PlayerState => ({
    ...state,
    players: data.map((p) => {
      const existing = state.players.find((ep) => ep.id === p.id);
      return {
        id: p.id,
        name: p.name,
        score: p.score,
        isSelected: existing?.isSelected ?? false,
      };
    }),
  }),
};

export default function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'addPlayer':
      return playerActions.addPlayer(state, action.payload);
    case 'deletePlayer':
      return playerActions.deletePlayer(state, action.payload);
    case 'addScore':
      return playerActions.addScore(state, action.payload.playerId, action.payload.points);
    case 'subtractScore':
      return playerActions.subtractScore(state, action.payload.playerId, action.payload.points);
    case 'resetScores':
      return playerActions.resetScores(state);
    case 'selectPlayer':
      return playerActions.selectPlayer(state, action.payload);
    case 'selectNextPlayer':
      return playerActions.selectNextPlayer(state);
    case 'syncPlayers':
      return playerActions.syncPlayers(state, action.payload);
    default:
      return state;
  }
}
