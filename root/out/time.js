export class Time {
    constructor(daylength = 60) {
        this.currentTime = 12.0;
        this.dayLength = daylength;
        this.speed = 24 / daylength;
    }
    update(deltaTime) {
        this.currentTime += this.speed * deltaTime;
        if (this.currentTime >= 24)
            this.currentTime -= 24;
    }
    getTimeFactor() {
        if (this.currentTime < 5)
            return 0.0; //Night
    }
}
