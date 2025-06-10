export type GameState = {
    current: 'loading' | 'running' | 'paused' | 'game-over';
    prev: GameState['current'] | null;
    tick: { timeScale: number | string }
}