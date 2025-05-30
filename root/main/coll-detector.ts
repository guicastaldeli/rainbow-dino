import * as THREE from 'three';
import { scene } from './main';

export class CollDetector {
    private objs: THREE.Object3D[] = [];
    private zone?: THREE.Box3;
    public box!: THREE.Box3;
    public clippingPlanes: THREE.Plane[] = [];
    private scene!: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    public setZone(box: THREE.Box3) {
        this.zone = box;
        this.box = box;
    }

    public addObject(obj: THREE.Object3D): void {
        if(obj && obj.position) this.objs.push(obj);
    }


    public applyClipping(obj: THREE.Object3D) {
        if(obj instanceof THREE.Mesh) {
            if(Array.isArray(obj.material)) {
                obj.material.forEach(mat => {
                    this.applyClipping(mat);
                    mat.needsUpdate = true;
                })
            } else {
                this.applyClippingMat(obj.material);
                obj.material.needsUpdate = true;
            }
            
            obj.updateMatrixWorld(true);
        }
    }

    private applyClippingMat(mat: THREE.Material) {
        if ('clippingPlanes' in mat) {
            mat.clippingPlanes = this.clippingPlanes;
            mat.clipIntersection = true;
            mat.clipShadows = true;
            mat.needsUpdate = true;
        }
    }

    public checkBounds(): void {
        if(!this.zone) return;

        for(const obj of this.objs) {
            if(!obj || !obj.position) continue;
            obj.updateMatrixWorld(true);

            const box = new THREE.Box3().setFromObject(obj, true);
        }
    }

    public isColliding(): THREE.Plane[] {
        if(!this.zone) return [];

        const lOffset = 37;
        const rOffset = -37;

         const lCollMin = new THREE.Vector3(
            (this.zone.min.x * 2 + rOffset) / 5,
            this.zone.min.y,
            this.zone.min.z
        );
        const lCollMax = new THREE.Vector3(
            (this.zone.max.x * 1.3 + rOffset) / 5,
            this.zone.max.y,
            this.zone.max.z
        );

        const rCollMin = new THREE.Vector3(
            (this.zone.min.x * 1.3 + lOffset) / 5,
            this.zone.min.y,
            this.zone.min.z
        );
        const rCollMax = new THREE.Vector3(
            (this.zone.max.x * 2.5 + lOffset) / 5,
            this.zone.max.y,
            this.zone.max.z
        );

        const lCollBox = new THREE.Box3(lCollMin, lCollMax);
    const rCollBox = new THREE.Box3(rCollMin, rCollMax);
    const lHelper = new THREE.Box3Helper(lCollBox, 0xff0000);
    const rHelper = new THREE.Box3Helper(rCollBox, 0x0000ff);
    this.scene.add(lHelper);
    this.scene.add(rHelper);
        
        const planes: THREE.Plane[] = [];

        planes.push(new THREE.Plane(new THREE.Vector3(1, 0, 0), -lCollMax.x)); //Right
        planes.push(new THREE.Plane(new THREE.Vector3(-1, 0, 0), lCollMin.x)); //Left
        planes.push(new THREE.Plane(new THREE.Vector3(0, 1, 0), -lCollMax.y)); //Top
        planes.push(new THREE.Plane(new THREE.Vector3(0, -1, 0), lCollMin.y)); //Bottom
        planes.push(new THREE.Plane(new THREE.Vector3(0, 0, 1), -lCollMax.z)); //Front
        planes.push(new THREE.Plane(new THREE.Vector3(0, 0, -1), lCollMin.z)); //Back

        planes.push(new THREE.Plane(new THREE.Vector3(1, 0, 0), -rCollMax.x)); //Right
        planes.push(new THREE.Plane(new THREE.Vector3(-1, 0, 0), rCollMin.x)); //Left
        planes.push(new THREE.Plane(new THREE.Vector3(0, 1, 0), -rCollMax.y)); //Top
        planes.push(new THREE.Plane(new THREE.Vector3(0, -1, 0), rCollMin.y)); //Bottom
        planes.push(new THREE.Plane(new THREE.Vector3(0, 0, 1), -rCollMax.z)); //Front
        planes.push(new THREE.Plane(new THREE.Vector3(0, 0, -1), rCollMin.z)); 

        return planes;
    }

    public isObjColliding(objBox: THREE.Box3): boolean {
        if(!this.zone) return false;

        const offset = -50;

        const coll = new THREE.Box3(
            new THREE.Vector3(
                (this.zone.min.x * 1.3 + offset) / 5,
                this.zone.min.y,
                this.zone.min.z,
            ),
            new THREE.Vector3(
                (this.zone.max.x * 1.3 + offset) / 5,
                this.zone.max.y,
                this.zone.max.z
            )
        );

        const collided = objBox.intersectsBox(coll);
        return collided;
    }
}