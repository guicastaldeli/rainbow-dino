export class Time {
    constructor(tick, daylength = 60) {
        this.scrollSpeed = 1.0;
        this.initSpeed = 0.001;
        this.lightningSpeed = 1.0 / (5 * 60);
        this.finalSpeed = 15;
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
        };
    }
    get dayCycle() {
        return {
            night: 0.0,
            dawn: (this.currentTime - 5) / 2,
            day: 1.0,
            dusk: 1.0 - (this.currentTime - 17) / 2
        };
    }
    getTimeFactor() {
        if (this.currentTimeCycle.night)
            return this.dayCycle.night;
        if (this.currentTimeCycle.dawn)
            return this.dayCycle.dawn;
        if (this.currentTimeCycle.day)
            return this.dayCycle.day;
        if (this.currentTimeCycle.dusk)
            return this.dayCycle.dusk;
        return this.dayCycle.night;
    }
    getTotalTime() {
        return this.currentTime;
    }
    resetState() {
        this.currentTime = 12.0;
        this.scrollSpeed = 1.0;
    }
    updateSpeed() {
        const updScrollSpeed = Math.min(this.scrollSpeed + this.initSpeed, this.finalSpeed);
        if (this.tick.getTimeScale() > 0)
            this.scrollSpeed = updScrollSpeed;
        return this.scrollSpeed;
    }
    update(deltaTime) {
        if (!this.tick.getTimeScale())
            return;
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        this.currentTime += this.speed * scaledDelta;
        if (this.currentTime >= 24)
            this.currentTime -= 24;
        this.updateSpeed();
    }
}
