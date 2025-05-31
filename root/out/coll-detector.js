import * as THREE from 'three';
export class CollDetector {
    constructor(scene) {
        this.clipPlane = new THREE.Plane();
        this.matCache = new Map();
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
        const helper = new THREE.Box3Helper(coll, 0xffff00);
        //this.scene?.add(helper);
        const collided = objBox.intersectsBox(coll);
        return collided;
    }
}
