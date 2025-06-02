import { Mesh } from 'three';

export type Obstacle = Mesh & { type: 'cactus' | 'crow' };

export class ObstacleManager {
    private obstacles: Obstacle[] = [];

    public addObstacle(ob: Obstacle | Obstacle[]) {
        if(Array.isArray(ob)) {
            this.obstacles.push(...ob);
        } else {
            this.obstacles.push(ob);
        }
    }

    public getObstaclesType(type: 'cactus' | 'crow'): Obstacle[] {
        return this.obstacles.filter(obs => obs.type === type);
    }

    public getObstacles(): Obstacle[] {
        return this.obstacles;
    }
}