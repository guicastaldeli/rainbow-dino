import * as THREE from 'three';
import { scene } from './main';

export class CollDetector {
    private scene?: THREE.Scene;

    private zone?: THREE.Box3;
    public box!: THREE.Box3;

    private clipPlane = new THREE.Plane();

    private updMat!: THREE.ShaderMaterial;
    private matCache = new Map<THREE.Object3D, THREE.ShaderMaterial>();

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

        const helper = new THREE.Box3Helper(coll, 0xffff00);
        //this.scene?.add(helper);

        const collided = objBox.intersectsBox(coll);
        return collided;
    }
}