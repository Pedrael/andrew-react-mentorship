type Player = {
  id: string;
  name: string;
  score: number;
  isSelected: boolean;
};

type PlayerState = {
  players: Player[];
};

export type PlayerAction =
  | { type: 'addPlayer'; payload: Player }
  | { type: 'deletePlayer'; payload: string };

const playerActions = {
  addPlayer: (state: PlayerState, player: Player) => ({
    ...state,
    players: [...state.players, player],
  }),
  deletePlayer: (state: PlayerState, playerId: string) => ({
    ...state,
    players: state.players.filter((player) => player.id !== playerId),
  }),
};

export default function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  if (action.type === 'addPlayer') return playerActions.addPlayer(state, action.payload);
  if (action.type === 'deletePlayer') return playerActions.deletePlayer(state, action.payload);
  return state;
}
