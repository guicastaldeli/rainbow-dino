import { Tick } from "./tick";
import { Time } from "./time";

export class Score {
    private tick: Tick;
    private time: Time;

    private totalScore: number;
    private currentScore: number;
    private speed: number;

    constructor(tick: Tick, time: Time) {
        this.tick = tick;
        this.time = time;

        this.totalScore = 0;
        this.currentScore = 0;

        this.speed = 0.0;
    }

    public getTotalScore(): number {
        return Math.floor(this.totalScore);
    }

    public update(currentSpeed: number) {
        const timeElapsed = this.time.getTotalTime() - this.speed;
        this.speed = this.time.getTotalTime();

        const points = timeElapsed;

        this.totalScore += points;
    }
}