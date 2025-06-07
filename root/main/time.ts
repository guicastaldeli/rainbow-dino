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
        if(this.currentTime < 5) return 0.0; //Night
        if(this.currentTime < 7) return (this.currentTime - 5) / 2; //Dawn
        if(this.currentTime < 17) return 1.0; //Day
        if(this.currentTime < 19) return 1.0 - (this.currentTime - 17) / 2; //Dusk
        return 0.0; //Night
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
