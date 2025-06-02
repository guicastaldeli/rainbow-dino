export class Tick {
    constructor() {
        this.timeScale = 1.0;
        this.paused = false;
    }
    setTimeScale(scale) {
        this.timeScale = Math.max(0, scale);
    }
    getTimeScale() {
        return this.paused ? 0 : this.timeScale;
    }
    togglePause() {
        this.paused = !this.paused;
    }
    getScaledDelta(deltaTime) {
        return deltaTime * this.getTimeScale();
    }
}
