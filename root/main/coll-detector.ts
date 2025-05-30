import * as THREE from 'three';
import { scene } from './main';

export class CollDetector {
    private objs: THREE.Object3D[] = [];
    private zone?: THREE.Box3;
    public box!: THREE.Box3;
    public clippingPlanes: THREE.Plane[] = [];
    private scene!: THREE.Scene;

    private clipPlane = new THREE.Plane();
    private lColl?: THREE.Box3;
    private lCollObjs = new Set<THREE.Object3D>();
    private rColl?: THREE.Box3;
    private collMatUpd!: THREE.ShaderMaterial;
    private collMatColor = new THREE.Color('rgb(0, 0, 0)');

    constructor(scene: THREE.Scene, obj: THREE.Object3D) {
        this.scene = scene;
        this.collMaterial(obj);
    }

    public setZone(box: THREE.Box3) {
        this.zone = box;
        this.isColliding();
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
        }
    }

    public isColliding() {
        if(!this.zone) return;

        const lOffset = -38;
        const rOffset = 37;

        this.lColl = new THREE.Box3(
            new THREE.Vector3(
                (this.zone.min.x * 2 + lOffset) / 5,
                this.zone.min.y,
                this.zone.min.z
            ),
            new THREE.Vector3(
                (this.zone.max.x * 1.3 + lOffset) / 5,
                this.zone.max.y,
                this.zone.max.z
            )
        );

        this.rColl = new THREE.Box3(
            new THREE.Vector3(
                (this.zone.min.x * 1.3 + rOffset) / 5,
                this.zone.min.y,
                this.zone.min.z
            ),
            new THREE.Vector3(
                (this.zone.max.x * 2.5 + rOffset) / 5,
                this.zone.max.y,
                this.zone.max.z
            )
        );

        const helper = new THREE.Box3Helper(this.lColl, new THREE.Color('rgb(255, 0, 0)'));
        this.scene.add(helper);
    }

    public async collMaterial(obj: THREE.Object3D): Promise<THREE.ShaderMaterial> {
        const [vertexShader, fragmentShader] = await Promise.all([
            fetch('../main/shaders/collVertexShader.glsl').then(res => res.text()),
            fetch('../main/shaders/collFragShader.glsl').then(res => res.text())
        ]);

        const tex = this.getObjTex(obj);

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                isColl: { value: false },
                map: { value: tex },
                clipNormal: { value: new THREE.Vector3(1, 0, 0) },
                clipConstant: { value: 0 }
            },
            vertexShader,
            fragmentShader,
        });

        this.collMatUpd = mat;
        return this.collMatUpd;
    }

    public checkColl(obj: THREE.Object3D, objBox: THREE.Box3): void {
        if(!this.lColl || !(obj instanceof THREE.Mesh)) return;

        const isColl = objBox.intersectsBox(this.lColl);

        if(isColl) {
            const center = new THREE.Vector3();
            this.lColl.getCenter(center);

            const objPos = new THREE.Vector3();
            obj.getWorldPosition(objPos);

            const leftNormal = new THREE.Vector3(-1, 0, 0);
            const leftPoint = new THREE.Vector3(this.lColl.max.x, 0, 0);
            this.clipPlane.setFromNormalAndCoplanarPoint(leftNormal, leftPoint);

            const mat = this.collMatUpd.clone();
            mat.uniforms.clipNormal.value = this.clipPlane.normal;
            mat.uniforms.clipConstant.value = -this.clipPlane.constant;
            obj.material = mat;
        }
    }

    private getObjTex(obj: THREE.Object3D): THREE.Texture | null {
        if(obj instanceof THREE.Mesh) {
            const mat = obj.material;

            if(Array.isArray(obj.material)) {
                for(const m of mat) {
                    const tex = this.extractTex(mat);
                    if(tex) return tex;
                }
            } else {
                const tex = this.extractTex(obj.material);
                if(tex) return tex;
            }
        }

        return null;
    }

    private extractTex(mat: THREE.Material): THREE.Texture | null {
        if(mat instanceof THREE.ShaderMaterial) {
            if('map' in mat.uniforms && mat.uniforms.map.value instanceof THREE.Texture) {
                return mat.uniforms.map.value;
            }

        }

        if('map' in mat && mat['map'] instanceof THREE.Texture) {
            return mat['map'];
        }

        return null;
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

        const helper = new THREE.Box3Helper(coll, 0xffff00);
        this.scene.add(helper);

        const collided = objBox.intersectsBox(coll);
        return collided;
    }
}