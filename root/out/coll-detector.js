var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as THREE from 'three';
export class CollDetector {
    constructor(scene, obj) {
        this.objs = [];
        this.clippingPlanes = [];
        this.clipPlane = new THREE.Plane();
        this.lCollObjs = new Set();
        this.collMatColor = new THREE.Color('rgb(0, 0, 0)');
        this.scene = scene;
        this.collMaterial(obj);
    }
    setZone(box) {
        this.zone = box;
        this.isColliding();
        this.box = box;
    }
    addObject(obj) {
        if (obj && obj.position)
            this.objs.push(obj);
    }
    applyClipping(obj) {
        if (obj instanceof THREE.Mesh) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(mat => {
                    this.applyClipping(mat);
                    mat.needsUpdate = true;
                });
            }
            else {
                this.applyClippingMat(obj.material);
                obj.material.needsUpdate = true;
            }
            obj.updateMatrixWorld(true);
        }
    }
    applyClippingMat(mat) {
        if ('clippingPlanes' in mat) {
            mat.clippingPlanes = this.clippingPlanes;
            mat.clipIntersection = true;
            mat.clipShadows = true;
            mat.needsUpdate = true;
        }
    }
    checkBounds() {
        if (!this.zone)
            return;
        for (const obj of this.objs) {
            if (!obj || !obj.position)
                continue;
            obj.updateMatrixWorld(true);
        }
    }
    isColliding() {
        if (!this.zone)
            return;
        const lOffset = -38;
        const rOffset = 37;
        this.lColl = new THREE.Box3(new THREE.Vector3((this.zone.min.x * 2 + lOffset) / 5, this.zone.min.y, this.zone.min.z), new THREE.Vector3((this.zone.max.x * 1.3 + lOffset) / 5, this.zone.max.y, this.zone.max.z));
        this.rColl = new THREE.Box3(new THREE.Vector3((this.zone.min.x * 1.3 + rOffset) / 5, this.zone.min.y, this.zone.min.z), new THREE.Vector3((this.zone.max.x * 2.5 + rOffset) / 5, this.zone.max.y, this.zone.max.z));
        const helper = new THREE.Box3Helper(this.lColl, new THREE.Color('rgb(255, 0, 0)'));
        this.scene.add(helper);
    }
    collMaterial(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const [vertexShader, fragmentShader] = yield Promise.all([
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
        });
    }
    checkColl(obj, objBox) {
        if (!this.lColl || !(obj instanceof THREE.Mesh))
            return;
        const isColl = objBox.intersectsBox(this.lColl);
        if (isColl) {
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
    getObjTex(obj) {
        if (obj instanceof THREE.Mesh) {
            const mat = obj.material;
            if (Array.isArray(obj.material)) {
                for (const m of mat) {
                    const tex = this.extractTex(mat);
                    if (tex)
                        return tex;
                }
            }
            else {
                const tex = this.extractTex(obj.material);
                if (tex)
                    return tex;
            }
        }
        return null;
    }
    extractTex(mat) {
        if (mat instanceof THREE.ShaderMaterial) {
            if ('map' in mat.uniforms && mat.uniforms.map.value instanceof THREE.Texture) {
                return mat.uniforms.map.value;
            }
        }
        if ('map' in mat && mat['map'] instanceof THREE.Texture) {
            return mat['map'];
        }
        return null;
    }
    isObjColliding(objBox) {
        if (!this.zone)
            return false;
        const offset = -50;
        const coll = new THREE.Box3(new THREE.Vector3((this.zone.min.x * 1.3 + offset) / 5, this.zone.min.y, this.zone.min.z), new THREE.Vector3((this.zone.max.x * 1.3 + offset) / 5, this.zone.max.y, this.zone.max.z));
        const helper = new THREE.Box3Helper(coll, 0xffff00);
        this.scene.add(helper);
        const collided = objBox.intersectsBox(coll);
        return collided;
    }
}
