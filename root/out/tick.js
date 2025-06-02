export class Tick {
    constructor() {
        this.timeScale = 1.0;
        this.paused = false;
        this.gameover = false;
    }
    setTimeScale(scale) {
        if (this.gameover)
            return;
        this.timeScale = Math.max(0, scale);
    }
    getTimeScale() {
        return this.paused ? 0 : this.timeScale;
    }
    togglePause() {
        this.paused = !this.paused;
    }
    gameOver() {
        this.gameover = true;
        this.timeScale = 0;
        return this.gameover;
    }
    getScaledDelta(deltaTime) {
        return deltaTime * this.getTimeScale();
    }
}
