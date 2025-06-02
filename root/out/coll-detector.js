import * as THREE from 'three';
export class CollDetector {
    constructor(scene) {
        this.scene = scene;
    }
    setZone(box) {
        this.zone = box;
    }
    isObjColliding(objBox) {
        if (!this.zone)
            return false;
        const offset = -50;
        const coll = new THREE.Box3(new THREE.Vector3((this.zone.min.x + offset) / 5, this.zone.min.y, this.zone.min.z), new THREE.Vector3((this.zone.max.x + offset) / 5, this.zone.max.y, this.zone.max.z));
        const collided = objBox.intersectsBox(coll);
        return collided;
    }
    outDisplayBounds(objBox) {
        if (!this.zone)
            return false;
        return (objBox.min.x < this.zone.min.x ||
            objBox.max.x > this.zone.max.x ||
            objBox.min.y < this.zone.min.y ||
            objBox.max.y > this.zone.max.y);
    }
    playerCollision(pBox, obs) {
        if (!pBox)
            return false;
        console.log('tst');
        for (const o of obs) {
            const obsBox = new THREE.Box3().setFromObject(o);
            if (pBox.intersectsBox(obsBox))
                return true;
        }
        return false;
    }
}
