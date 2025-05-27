export class Time {
    private currentTime: number;
    private speed: number;
    private dayLength: number;

    constructor(daylength: number = 60) {
        this.currentTime = 12.0;
        this.dayLength = daylength;
        this.speed = 24 / daylength;
    }

    public update(deltaTime: number) {
        this.currentTime += this.speed * deltaTime;
        if(this.currentTime >= 24) this.currentTime -= 24;
    }

    public getTimeFactor(): number {
        if(this.currentTime < 5) return 0.0; //Night

    }
}
