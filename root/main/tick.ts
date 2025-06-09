import { GameState } from "./game-state";

export class Tick {
    private timeScale: number = 1.0;
    private paused: boolean = false;
    private gameOverCalls: (() => void)[] = [];
    private gameOver: boolean = false;

    public setTimeScale(scale: number): void {
        if(this.gameOver) return;
        this.timeScale = Math.max(0, scale);
    }

    public getTimeScale(): number {
        return this.paused ? 0 : this.timeScale;
    }

    public togglePause(): void {
        this.paused = !this.paused;
    }

    public onGameOver(callback: () => void) {
        this.gameOverCalls.push(callback);
    }
    
    public setGameOver(): boolean {
        if(!this.gameOver) {
            this.gameOver = true;
            this.timeScale = 0;
            this.gameOverCalls.forEach(cb => cb());
        }
        
        return this.gameOver;
    }

    public getScaledDelta(deltaTime: number): number {
        return deltaTime * this.getTimeScale();
    }

    public resetState(state?: Partial<GameState['tick']>): void {
        this.paused = state?.paused ?? false;
        this.gameOver = state?.gameOver ?? false;
        this.getScaledDelta(this.timeScale);
    }
}