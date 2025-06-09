export interface GameState {
    time: { currentTime: number; scrollSpeed: number}
    score: { currentScore: number }
    tick: { paused: boolean; gameOver: boolean }
    player?: {
        pos: { x: number, y: number },
        isShifted: boolean;
        isHit: boolean;
        isGrounded: boolean;
        jumpSpeed: number;
        currentFrameIndex: number;
    }
}