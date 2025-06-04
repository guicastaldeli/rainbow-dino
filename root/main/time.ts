import { Tick } from "./tick";

export class Time {
    private tick: Tick;
    private currentTime: number;
    private speed: number;
    private scrollSpeed: number;
    private dayLength: number;

    constructor(tick: Tick, daylength: number = 60) {
        this.tick = tick;
        this.currentTime = 12.0;
        this.dayLength = daylength;
        this.speed = 24 / daylength;
        this.scrollSpeed = 1.0;
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
        if(this.tick.getTimeScale()) this.scrollSpeed = Math.min(this.scrollSpeed + 0.001, 15);
        return this.scrollSpeed;
    }

    public update(deltaTime: number) {
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        this.currentTime += this.speed * scaledDelta;
        if(this.currentTime >= 24) this.currentTime -= 24;
        this.updateSpeed();
    }

}
