export class ObstacleManager {
    constructor() {
        this.obstacles = [];
    }
    addObstacle(ob) {
        if (Array.isArray(ob)) {
            this.obstacles.push(...ob);
        }
        else {
            this.obstacles.push(ob);
        }
    }
    getObstaclesType(type) {
        return this.obstacles.filter(obs => obs.type === type);
    }
    getObstacles() {
        return this.obstacles;
    }
}
