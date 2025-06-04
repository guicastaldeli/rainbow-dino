export class Time {
    constructor(tick, daylength = 60) {
        this.tick = tick;
        this.currentTime = 12.0;
        this.dayLength = daylength;
        this.speed = 24 / daylength;
    }
    update(deltaTime) {
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        this.currentTime += this.speed * scaledDelta;
        if (this.currentTime >= 24)
            this.currentTime -= 24;
    }
    getTimeFactor() {
        //if(this.currentTime < 5) return 0.0; //Night
        //if(this.currentTime < 7) return (this.currentTime - 5) / 2; //Dawn
        //if(this.currentTime < 17) return 1.0; //Day
        //if(this.currentTime < 19) return 1.0 - (this.currentTime - 17) / 2; //Dusk
        return 0.0; //Night
    }
    getTotalTime() {
        return this.currentTime;
    }
}
