export class ObstacleManager {
    constructor() {
        this.obstacles = [];
    }
    addObstacle(obs) {
        if (Array.isArray(obs)) {
            this.obstacles.push(...obs);
        }
        else {
            this.obstacles.push(obs);
        }
    }
    getObstaclesType(type) {
        return this.obstacles.filter(obs => obs.type === type);
    }
    getObstacles() {
        return this.obstacles;
    }
    resetState() {
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'cactus') {
                obstacle.position.x = (Math.random() * 32) + 8;
                obstacle.position.y = -3;
                obstacle.position.z = -3.23;
            }
            else if (obstacle.type === 'crow') {
                obstacle.position.x = (Math.random() * 32);
                obstacle.position.y = Math.random() * (0.5 - (-1)) + (-1);
                obstacle.position.z = Math.random() * ((-3.4) - (-3.2)) + (-3.2);
            }
        });
        this.obstacles.sort((a, b) => a.position.x - b.position.x);
        const minGap = 16;
        for (let i = 1; i < this.obstacles.length; i++) {
            const prev = this.obstacles[i - 1];
            const curr = this.obstacles[i];
            if (curr.position.x - prev.position.x < minGap) {
                curr.position.x = prev.position.x + minGap;
            }
        }
    }
    clearObstacles() {
        this.obstacles = [];
    }
}
