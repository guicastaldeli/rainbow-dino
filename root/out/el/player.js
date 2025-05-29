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
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
export class Player {
    constructor(timeCycle) {
        this.pos = {
            x: 3,
            y: 0,
            z: -3
        };
        this.timeCycle = timeCycle;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
        this.loadPlayer();
    }
    loadPlayer() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [vertexShader, fragmentShader] = yield Promise.all([
                    this.loadShader('./el/shaders/vertexShader.glsl'),
                    this.loadShader('./el/shaders/fragShader.glsl')
                ]);
                const path = '../../../assets/obj/cube-test.obj';
                const texPath = '../../../assets/textures/cube-test.png';
                const tex = this.texLoader.load(texPath);
                this.material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0.0 },
                        timeFactor: { value: 0.0 },
                        map: { value: tex }
                    },
                    vertexShader,
                    fragmentShader,
                    side: THREE.DoubleSide,
                });
                this.loader.load(path, (obj) => {
                    this.mesh = obj;
                    this.mesh.traverse((m) => {
                        if (m instanceof THREE.Mesh)
                            m.material = this.material;
                    });
                    this.mesh.scale.z = 0.1;
                    //this.mesh.receiveShadow = true;
                    this.mesh.position.x = this.pos.x;
                    this.mesh.position.y = this.pos.y;
                    this.mesh.position.z = this.pos.z;
                });
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    loadShader(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield fetch(url);
            if (!res.ok)
                throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
            return yield res.text();
        });
    }
    update(deltaTime) {
        if (!this.material)
            return;
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001;
        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }
    ready() {
        return new Promise(res => {
            if (!this.mesh) {
                const _check = () => this.mesh ? res(this.mesh) : setTimeout(_check, 0);
                _check();
            }
        });
    }
}
