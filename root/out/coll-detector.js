import * as THREE from 'three';
export class CollDetector {
    constructor(scene) {
        this.scene = scene;
    }
    setZone(box) {
        this.zone = box;
    }
    resetState() {
        this.box = new THREE.Box3();
        this.zone = undefined;
    }
    isColliding(objBox) {
        if (!this.zone)
            return false;
        const offset = -60;
        const coll = new THREE.Box3(new THREE.Vector3((this.zone.min.x + offset) / 5, this.zone.min.y, (this.zone.min.z - 10)), new THREE.Vector3((this.zone.max.x + offset) / 5, this.zone.max.y, (this.zone.max.z + 10)));
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
        if (!pBox || !obs || obs.length === 0)
            return false;
        for (const o of obs) {
            if (!o)
                continue;
            const obsBox = new THREE.Box3().setFromObject(o);
            if (pBox.intersectsBox(obsBox))
                return true;
        }
        return false;
    }
}
