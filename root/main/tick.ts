export class Tick {
    private timeScale: number = 1.0;
    private paused: boolean = false;
    private gameOverCalls: (() => void)[] = [];
    private gameover: boolean = false;

    public setTimeScale(scale: number): void {
        if(this.gameover) return;
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
    
    public gameOver(): boolean {
        if(!this.gameover) {
            this.gameover = true;
            this.timeScale = 0;
            this.gameOverCalls.forEach(cb => cb());
        }
        
        return this.gameover;
    }

    public getScaledDelta(deltaTime: number): number {
        return deltaTime * this.getTimeScale();
    }
}