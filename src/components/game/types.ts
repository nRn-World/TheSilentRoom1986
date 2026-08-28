// Shared game state union used by Game and all sub-system components.
export type GameState =
  | 'narrative'
  | 'playing'
  | 'gameover'
  | 'victory'
  | 'upgrading'
  | 'settings'
  | 'inventory'
  | 'shop'
  | 'boss'
  | 'multiplayer';
