export class Tick {
    constructor() {
        this.timeScale = 1.0;
        this.paused = false;
        this.gameOverCalls = [];
        this.gameOver = false;
    }
    setTimeScale(scale) {
        if (this.gameOver)
            return;
        this.timeScale = Math.max(0, scale);
    }
    getTimeScale() {
        return this.paused ? 0 : this.timeScale;
    }
    togglePause() {
        this.paused = !this.paused;
    }
    onGameOver(callback) {
        this.gameOverCalls.push(callback);
    }
    setGameOver() {
        if (!this.gameOver) {
            this.gameOver = true;
            this.timeScale = 0;
            this.gameOverCalls.forEach(cb => cb());
        }
        return this.gameOver;
    }
    getScaledDelta(deltaTime) {
        return deltaTime * this.getTimeScale();
    }
    resetState(state) {
        var _a, _b;
        this.paused = (_a = state === null || state === void 0 ? void 0 : state.paused) !== null && _a !== void 0 ? _a : false;
        this.gameOver = (_b = state === null || state === void 0 ? void 0 : state.gameOver) !== null && _b !== void 0 ? _b : false;
        this.getScaledDelta(this.timeScale);
    }
}
