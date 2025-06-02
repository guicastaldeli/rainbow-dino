import * as THREE from 'three';
import { scene } from './main';

export class CollDetector {
    private scene?: THREE.Scene;
    private zone?: THREE.Box3;
    public box!: THREE.Box3;

    constructor(scene?: THREE.Scene) {
        this.scene = scene;
    }
    
    public setZone(box: THREE.Box3) {
        this.zone = box;
    }

    public isObjColliding(objBox: THREE.Box3): boolean {
        if(!this.zone) return false;

        const offset = -50;

        const coll = new THREE.Box3(
            new THREE.Vector3(
                (this.zone.min.x + offset) / 5,
                this.zone.min.y,
                this.zone.min.z,
            ),
            new THREE.Vector3(
                (this.zone.max.x + offset) / 5,
                this.zone.max.y,
                this.zone.max.z
            )
        );

        const collided = objBox.intersectsBox(coll);
        return collided;
    }

    public outDisplayBounds(objBox: THREE.Box3): boolean {
        if(!this.zone) return false;

        return (
            objBox.min.x < this.zone.min.x ||
            objBox.max.x > this.zone.max.x ||
            objBox.min.y < this.zone.min.y ||
            objBox.max.y > this.zone.max.y
        );
    }

    public playerCollision(pBox: THREE.Box3, obs: THREE.Mesh[]): boolean {
        if(!pBox) return false;
        
        for(const o of obs) {
            const obsBox = new THREE.Box3().setFromObject(o);
            if(pBox.intersectsBox(obsBox)) return true;
        }

        return false;
    }
}