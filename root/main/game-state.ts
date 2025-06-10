export type GameState = {
    current: 
        'loading' |
        'menu' |
        'running' | 
        'paused' | 
        'game-over'
    ;
    
    prev: GameState['current'] | null;
    tick: { timeScale: number | string }
}