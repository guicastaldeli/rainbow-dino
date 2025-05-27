export class Time {
    constructor(daylength = 60) {
        this.currentTime = 12.0;
        this.dayLength = daylength;
        this.speed = 24 / daylength;
    }
    update(deltaTime) {
        this.currentTime += this.currentTime * deltaTime;
        if (this.currentTime >= 24)
            this.currentTime -= 24;
    }
    getCurrentTime() {
        return this.currentTime;
    }
    getTimeDay() {
        if (this.currentTime >= 5 && this.currentTime < 7)
            return 'dawn';
        if (this.currentTime >= 7 && this.currentTime < 17)
            return 'day';
        if (this.currentTime >= 17 && this.currentTime < 19)
            return 'dusk';
        return 'night';
    }
    getTimeFactor() {
        console.log(this.currentTime);
        if (this.currentTime < 5)
            return 0.0; //Night
        if (this.currentTime < 7)
            return (this.currentTime - 5) / 2; //Dawn
        if (this.currentTime < 17)
            return 1.0; //Day
        if (this.currentTime < 19)
            return 1.0 - (this.currentTime - 17) / 2; //Dusk
        return 0.0; //Night
    }
}
