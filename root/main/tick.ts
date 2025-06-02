export class Tick {
    private timeScale: number = 1.0;
    private paused: boolean = false;

    public setTimeScale(scale: number): void {
        this.timeScale = Math.max(0, scale);
    }

    public getTimeScale(): number {
        return this.paused ? 0 : this.timeScale;
    }

    public togglePause(): void {
        this.paused = !this.paused;
    }

    public getScaledDelta(deltaTime: number): number {
        return deltaTime * this.getTimeScale();
    }
}