import { GameState } from "./game-state";
import { Tick } from "./tick";

export class Time {
    private tick: Tick;
    private currentTime: number;
    private dayLength: number;

    private speed: number;
    private scrollSpeed: number = 1.0;
    private initSpeed: number = 0.001;
    private lightningSpeed: number = 1.0 / (5 * 60);
    private finalSpeed: number = 15;

    constructor(tick: Tick, daylength: number = 60) {
        this.tick = tick;
        this.currentTime = 12.0;
        this.dayLength = daylength;

        this.speed = 24 / daylength;
    }

    get currentTimeCycle() {
        return {
            night: (this.currentTime >= 19 || this.currentTime < 5),
            dawn: (this.currentTime >= 5 && this.currentTime < 7),
            day: (this.currentTime >= 7 && this.currentTime < 17),
            dusk: (this.currentTime >= 17 && this.currentTime < 19)
        }
    }

    get dayCycle() {
        return {
            night: 0.0,
            dawn: (this.currentTime - 5) / 2,
            day: 1.0,
            dusk: 1.0 - (this.currentTime - 17) / 2
        }
    }

    public getTimeFactor(): number {
        if(this.currentTimeCycle.night) return this.dayCycle.night;
        if(this.currentTimeCycle.dawn) return this.dayCycle.dawn;
        if(this.currentTimeCycle.day) return this.dayCycle.day;
        if(this.currentTimeCycle.dusk) return this.dayCycle.dusk;
        return this.dayCycle.night;
    }

    public getTotalTime(): number {
        return this.currentTime;
    }

    public resetState(state?: Partial<GameState['time']>): void {
        this.currentTime = state?.currentTime ?? 12.0;
        this.scrollSpeed = state?.scrollSpeed ?? 1.0;
    }

    public updateSpeed(): number {
        const updScrollSpeed = Math.min(this.scrollSpeed + this.initSpeed, this.finalSpeed);
        if(this.tick.getTimeScale() > 0) this.scrollSpeed = updScrollSpeed
        return this.scrollSpeed;
    }

    public update(deltaTime: number) {
        if(!this.tick.getTimeScale()) return;

        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        this.currentTime += this.speed * scaledDelta;
        if(this.currentTime >= 24) this.currentTime -= 24;

        this.updateSpeed();
    }
}
