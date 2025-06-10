export class Tick {
    constructor() {
        this.timeScale = 1.0;
        this.gameOverCalls = [];
        this.pauseCalls = [];
        this.resumeCalls = [];
        this.state = {
            current: 'loading',
            prev: null,
            tick: { timeScale: this.timeScale }
        };
        this.onPause(() => { var _a; return (_a = this.screenPause) === null || _a === void 0 ? void 0 : _a.ready(); });
        this.onResume(() => { var _a; return (_a = this.screenPause) === null || _a === void 0 ? void 0 : _a.hideMessage(); });
    }
    run() {
        if (this.state.current === 'loading') {
            this.state.prev = this.state.current;
            this.state.current = 'running';
            this.timeScale = this.timeScale;
            this.resumeCalls.forEach(cb => cb());
        }
    }
    setScreenPause(screen) {
        this.screenPause = screen;
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
        else if (this.state.current === 'running') {
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
        this.state.prev = this.state.current;
        this.state.current = 'running';
        this.resumeCalls.forEach(cb => cb());
    }
    onResume(cb) {
        this.resumeCalls.push(cb);
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
    setState(state) {
        this.state.prev = this.state.current;
        this.state.current = state;
    }
    getState() {
        return this.state;
    }
}
