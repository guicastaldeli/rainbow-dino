var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class Tick {
    constructor() {
        this.timeScale = 1.0;
        this.gameOverCalls = [];
        this.pauseCalls = [];
        this.resumeCalls = [];
        this.resetCalls = [];
        this.state = {
            current: 'loading',
            prev: null,
            tick: { timeScale: this.timeScale }
        };
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
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state.current !== 'running')
                return;
            this.state.prev = this.state.current;
            this.state.current = 'paused';
            this.pauseCalls.forEach(cb => cb());
            if (this.screenPause)
                yield this.screenPause.ready();
        });
    }
    resume() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state.current !== 'paused')
                return;
            this.state.prev = this.state.current;
            this.state.current = 'running';
            this.resumeCalls.forEach(cb => cb());
            if (this.screenPause)
                yield this.screenPause.hideMessage();
        });
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
    onReset(cb) {
        this.resetCalls.push(cb);
    }
    reset() {
        if (this.state.current === 'game-over') {
            this.state.prev = this.state.current;
            this.state.current = 'loading';
            this.timeScale = 1.0;
            this.state.tick.timeScale = this.timeScale;
            this.resetCalls.forEach(cb => cb());
        }
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
