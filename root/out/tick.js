export class Tick {
    constructor() {
        this.timeScale = 1.0;
        this.gameOverCalls = [];
        this.pauseCalls = [];
        this.resumeCalls = [];
        this.state = {
            current: 'running',
            prev: null,
            tick: { timeScale: this.timeScale }
        };
    }
    setTimeScale(scale) {
        if (this.state.current === 'game-over')
            return;
        this.timeScale = Math.max(0, scale);
        this.state.tick.timeScale = this.timeScale;
    }
    getTimeScale(t) {
        return this.state.current === 'paused' ? 0.0 : this.timeScale;
    }
    togglePause() {
        if (this.state.current === 'game-over')
            return;
        if (this.state.current === 'paused') {
            this.resume();
        }
        else {
            this.pause();
        }
    }
    pause() {
        if (this.state.current !== 'running')
            return;
        this.state.prev = this.state.current;
        this.state.current = 'paused';
        this.pauseCalls.forEach(cb => cb());
    }
    resume() {
        if (this.state.current !== 'paused')
            return;
        this.state.current = this.state.prev || 'running';
        this.state.prev = null;
        this.resumeCalls.forEach(cb => cb());
    }
    onPause(cb) {
        this.pauseCalls.push(cb);
    }
    onGameOver(cb) {
        this.gameOverCalls.push(cb);
    }
    setGameOver() {
        if (this.state.current === 'game-over')
            return false;
        this.state.prev = this.state.current;
        this.state.current = 'game-over';
        this.timeScale = 0.0;
        this.gameOverCalls.forEach(cb => cb());
        return true;
    }
    getScaledDelta(deltaTime) {
        return deltaTime * this.getTimeScale();
    }
    getState() {
        return this.state.current;
    }
}
