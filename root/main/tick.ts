import { GameState } from "./game-state";
import { ScreenPauseMenu } from "./screens/pause-menu.js";

export class Tick {
    private state: GameState;
    private timeScale: number = 1.0;
    private gameOverCalls: (() => void)[] = [];
    private pauseCalls: (() => void)[] = [];
    private resumeCalls: (() => void)[] = [];
    private resetCalls: (() => void)[] = [];

    private screenPause: any;

    constructor() {
        this.state = {
            current: 'loading',
            prev: null,
            tick: { timeScale: this.timeScale }
        }
    }

    public run() {
        if(this.state.current === 'loading') {
            this.state.prev = this.state.current;
            this.state.current = 'running';
            this.timeScale = this.timeScale;
            this.resumeCalls.forEach(cb => cb());
        }
    }

    public setScreenPause(screen: any) {
        this.screenPause = screen;
    }

    public setTimeScale(scale: number): void {
        if(this.state.current === 'game-over') return;
        this.timeScale = Math.max(0, scale);
        this.state.tick.timeScale = this.timeScale;
    }

    public getTimeScale(t?: number): number {
        return this.state.current === 'paused' ? 0.0 : this.timeScale;
    }

    public togglePause(): void {
        if(this.state.current === 'game-over') return;

        if(this.state.current === 'paused') {
            this.resume();
        } else if(this.state.current === 'running') {
            this.pause();
        }
    }

    public async pause(): Promise<void> {
        if(this.state.current !== 'running') return;

        this.state.prev = this.state.current;
        this.state.current = 'paused';
        this.pauseCalls.forEach(cb => cb());

        if(this.screenPause) await this.screenPause.ready();
    }

    public async resume(): Promise<void> {
        if(this.state.current !== 'paused') return;

        this.state.prev = this.state.current;
        this.state.current = 'running';
        this.resumeCalls.forEach(cb => cb());

        if(this.screenPause) await this.screenPause.hideMessage();
    }

    public onPause(cb: () => void): void {
        this.pauseCalls.push(cb);
    }

    public onGameOver(cb: () => void) {
        this.gameOverCalls.push(cb);
    }
    
    public setGameOver(): boolean {
        if(this.state.current === 'game-over') return false;

        this.state.prev = this.state.current;
        this.state.current = 'game-over';
        this.timeScale = 0.0;
        this.gameOverCalls.forEach(cb => cb());
        
        return true;
    }
    
    public onReset(cb: () => void): void {
        this.resetCalls.push(cb)
    }

    public reset(): void {
        if(this.state.current === 'game-over') {
            this.state.prev =  this.state.current;
            this.state.current = 'loading';
            this.timeScale = 1.0;
            this.state.tick.timeScale = this.timeScale;

            this.resetCalls.forEach(cb => cb());
        }
    }

    public getScaledDelta(deltaTime: number): number {
        return deltaTime * this.getTimeScale();
    }

    public setState(state: GameState['current']): void {
        this.state.prev = this.state.current;
        this.state.current = state;
    }

    public getState(): GameState {
        return this.state;
    }
}