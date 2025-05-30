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
    constructor(scene) {
        this.clipPlane = new THREE.Plane();
        this.lCollObjs = new Set();
        this.rCollObjs = new Set();
        this.trackedObjs = new Set();
        this.matCache = new Map();
        this.scene = scene;
    }
    setZone(box) {
        this.zone = box;
        this.isColliding();
    }
    isColliding() {
        var _a, _b;
        if (!this.zone)
            return;
        const lOffset = -38;
        const rOffset = 37;
        //Left Coll
        this.lColl = new THREE.Box3(new THREE.Vector3((this.zone.min.x * 2 + lOffset) / 5, this.zone.min.y, this.zone.min.z), new THREE.Vector3((this.zone.max.x * 1.3 + lOffset) / 5, this.zone.max.y, this.zone.max.z));
        //Right Coll
        this.rColl = new THREE.Box3(new THREE.Vector3((this.zone.min.x * 1.3 + rOffset) / 5, this.zone.min.y, this.zone.min.z), new THREE.Vector3((this.zone.max.x * 2.5 + rOffset) / 5, this.zone.max.y, this.zone.max.z));
        const helper = new THREE.Box3Helper(this.lColl, new THREE.Color('rgb(255, 0, 0)'));
        (_a = this.scene) === null || _a === void 0 ? void 0 : _a.add(helper);
        const helper2 = new THREE.Box3Helper(this.rColl, new THREE.Color('rgb(255, 0, 0)'));
        (_b = this.scene) === null || _b === void 0 ? void 0 : _b.add(helper2);
    }
    isObjColliding(objBox) {
        var _a;
        if (!this.zone)
            return false;
        const offset = -50;
        const coll = new THREE.Box3(new THREE.Vector3((this.zone.min.x * 1.3 + offset) / 5, this.zone.min.y, this.zone.min.z), new THREE.Vector3((this.zone.max.x * 1.3 + offset) / 5, this.zone.max.y, this.zone.max.z));
        const helper = new THREE.Box3Helper(coll, 0xffff00);
        (_a = this.scene) === null || _a === void 0 ? void 0 : _a.add(helper);
        const collided = objBox.intersectsBox(coll);
        return collided;
    }
    checkColl(obj, objBox) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.lColl || !this.rColl || !(obj instanceof THREE.Mesh))
                return;
            let mat = this.matCache.get(obj);
            if (!mat) {
                mat = yield this.collMaterial(obj);
                this.matCache.set(obj, mat);
            }
            const isLeftColl = objBox.intersectsBox(this.lColl);
            const isRightColl = objBox.intersectsBox(this.rColl);
            const isColl = isLeftColl || isRightColl;
            mat.uniforms.isColl.value = isColl;
            const coll = isLeftColl ? this.lColl : this.rColl;
            if (isColl) {
                const normal = new THREE.Vector3(0, 1, 0);
                const point = new THREE.Vector3(coll.max.x, 0, 0);
                this.clipPlane.setFromNormalAndCoplanarPoint(normal, point);
                mat.uniforms.clipNormal.value = this.clipPlane.normal;
                mat.uniforms.clipConstant.value = -this.clipPlane.constant;
            }
            console.log(`Checking collision for ${obj.name || obj.uuid}:`);
            console.log(`Obj position:`, obj.position);
            console.log(`Obj box:`, objBox);
            console.log(`Left coll box:`, this.lColl);
            console.log(`Right coll box:`, this.rColl);
            console.log(`Left collision:`, isLeftColl);
            console.log(`Right collision:`, isRightColl);
            obj.material = mat;
            mat.needsUpdate = true;
        });
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
            this.matCache.set(obj, mat);
            this.updMat = mat;
            return mat;
        });
    }
}
