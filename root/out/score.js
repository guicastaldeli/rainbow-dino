export class Score {
    constructor(tick, time) {
        this.tick = tick;
        this.time = time;
        this.totalScore = 0;
        this.currentScore = 0;
        this.speed = 0.0;
    }
    getTotalScore() {
        return Math.floor(this.totalScore);
    }
    update(currentSpeed) {
        const timeElapsed = this.time.getTotalTime() - this.speed;
        this.speed = this.time.getTotalTime();
        const points = timeElapsed;
        this.totalScore += points;
    }
}
