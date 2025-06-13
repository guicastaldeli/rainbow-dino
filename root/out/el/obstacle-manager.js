export class ObstacleManager {
    constructor(cactus, crow) {
        this.obstacles = [];
        this.cactus = cactus;
        this.crow = crow;
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
            obstacle.geometry.dispose();
            if (this.cactus && obstacle.type === 'cactus') {
                obstacle.position.x = this.cactus.pos.x;
                obstacle.position.y = this.cactus.pos.y;
                obstacle.position.z = this.cactus.pos.z;
            }
            else if (this.crow && obstacle.type === 'crow') {
                obstacle.position.x = this.crow.pos.x;
                obstacle.position.y = this.crow.pos.y();
                obstacle.position.z = this.crow.pos.z();
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
        this.obstacles.forEach(o => {
            o.updateMatrix();
            o.updateMatrixWorld(true);
        });
    }
    clearObstacles() {
        this.obstacles.forEach(obs => {
            if (obs.parent)
                obs.parent.remove(obs);
            if (obs.geometry)
                obs.geometry.dispose();
            if (obs.material) {
                if (Array.isArray(obs.material)) {
                    obs.material.forEach(m => m.dispose());
                }
                else {
                    obs.material.dispose();
                }
            }
        });
        this.obstacles = [];
    }
}
