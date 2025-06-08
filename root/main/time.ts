import { Tick } from "./tick";

export class Time {
    private tick: Tick;
    private currentTime: number;
    private dayLength: number;

    private speed: number;
    private scrollSpeed: number = 1.0;
    private initSpeed: number = 0.001;
    private finalSpeed: number = 15;

    constructor(tick: Tick, daylength: number = 60) {
        this.tick = tick;
        this.currentTime = 12.0;
        this.dayLength = daylength;

        this.speed = 24 / daylength;
    }

    public getTimeFactor(): number {
        const currentTimeCycle = {
            night: (this.currentTime < 5),
            dawn: (this.currentTime < 7),
            day: (this.currentTime < 17),
            dusk: (this.currentTime < 19)
        }

        const dayCycle = {
            night: 0.0,
            dawn: (this.currentTime - 5) / 2,
            day: 1.0,
            dusk: 1.0 -(this.currentTime - 17) / 2
        }

        if(currentTimeCycle.night) return dayCycle.night;
        if(currentTimeCycle.dawn) return dayCycle.dawn;
        if(currentTimeCycle.day) return dayCycle.day;
        if(currentTimeCycle.dusk) return dayCycle.dusk;
        return dayCycle.night;
    }

    public getTotalTime(): number {
        return this.currentTime;
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
