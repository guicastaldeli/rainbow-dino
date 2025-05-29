import * as THREE from 'three';
export class CollDetector {
    constructor() {
        this.objs = [];
    }
    setZone(box) {
        this.zone = box;
    }
    addObject(obj) {
        if (obj && obj.position)
            this.objs.push(obj);
    }
    checkBounds() {
        if (!this.zone)
            return;
        for (const obj of this.objs) {
            if (!obj || !obj.position)
                continue;
            obj.updateMatrixWorld(true);
            const objBox = new THREE.Box3().setFromObject(obj);
            if (this.isColliding(objBox)) {
                console.log(`Part of ${obj.name || 'Unnamed object'} is outside display area!`);
                console.log(`Object position: ${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(2)}, ${obj.position.z.toFixed(2)}`);
            }
        }
    }
    isColliding(objBox) {
        if (!this.zone)
            return false;
        return (objBox.max.x < this.zone.min.x / 1.38 ||
            objBox.min.x > this.zone.max.x / 1.38 ||
            objBox.max.y < this.zone.min.y ||
            objBox.min.y > this.zone.max.y ||
            objBox.max.z < this.zone.min.z ||
            objBox.min.z > this.zone.max.z);
    }
}
