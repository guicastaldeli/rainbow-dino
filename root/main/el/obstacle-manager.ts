import { Mesh } from 'three';

export type Obstacle = Mesh & { type: 'cactus' | 'crow' };

export class ObstacleManager {
    private obstacles: Obstacle[] = [];

    public addObstacle(obs: Obstacle | Obstacle[]) {
        if(Array.isArray(obs)) {
            this.obstacles.push(...obs);
        } else {
            this.obstacles.push(obs);
        }
    }

    public getObstaclesType(type: 'cactus' | 'crow'): Obstacle[] {
        return this.obstacles.filter(obs => obs.type === type);
    }

    public getObstacles(): Obstacle[] {
        return this.obstacles;
    }

    public resetState(): void {
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'cactus') {
                obstacle.position.x = (Math.random() * 32) + 8;
                obstacle.position.y = -3;
                obstacle.position.z = -3.23;
            } else if (obstacle.type === 'crow') {
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

    public clearObstacles(): void {
        this.obstacles = [];
    }
}