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
export class Crow {
    constructor(tick, timeCycle, display) {
        this.obs = [];
        this.obsBox = [];
        this.obsGroup = new THREE.Group();
        this.currentModelIndex = 0;
        this.lastSwitchTime = 0;
        this.switchInterval = 0.1;
        this.currentTexture = [];
        this.models = [
            {
                model: '../../../assets/obj/crow1.obj',
                tex: '../../../assets/textures/crow1.png'
            },
            {
                model: '../../../assets/obj/crow2.obj',
                tex: '../../../assets/textures/crow2.png'
            }
        ];
        this.speed = 5;
        this.length = 10;
        this.size = {
            w: 1,
            h: 1,
            d: 0.1
        };
        this.pos = {
            x: 9,
            y: () => Math.random() * (-2.5 - -3) * -3,
            z: -3.1,
            gap: () => Math.random() * (64 - 32) * 32
        };
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.display = display;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
    }
    createCrow(x) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [vertexShader, fragmentShader] = yield Promise.all([
                    this.loadShader('./el/shaders/vertexShader.glsl'),
                    this.loadShader('./el/shaders/fragShader.glsl')
                ]);
                if (this.currentTexture.length === 0) {
                    this.currentTexture = yield Promise.all(this.models.map(model => this.texLoader.loadAsync(model.tex)));
                }
                const bounds = this.display.getBounds();
                this.material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0.0 },
                        timeFactor: { value: 0.0 },
                        map: { value: this.currentTexture[this.currentModelIndex] },
                        bounds: { value: bounds.clone() },
                        isObs: { value: true }
                    },
                    vertexShader,
                    fragmentShader,
                    side: THREE.DoubleSide
                });
                const initialModel = this.models[this.currentModelIndex];
                return new Promise((res) => {
                    this.loader.load(initialModel.model, (obj) => __awaiter(this, void 0, void 0, function* () {
                        this.mesh = obj;
                        let obs;
                        this.mesh.traverse((m) => {
                            if (m instanceof THREE.Mesh && !obs) {
                                m.material = this.material;
                                obs = m;
                            }
                        });
                        if (!obs)
                            throw new Error('err');
                        const crowMesh = obs;
                        crowMesh.position.x = (x * this.pos.gap()) + this.pos.x;
                        crowMesh.position.y = this.pos.y();
                        crowMesh.position.z = this.pos.z;
                        const box = new THREE.Box3().setFromObject(crowMesh);
                        this.obsBox.push(box);
                        res(obs);
                    }));
                });
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
    animateObs(items) {
        const scaledDelta = this.tick.getScaledDelta(this.deltaTime);
        const currentTime = performance.now() * 0.001 * scaledDelta;
        if (currentTime - this.lastSwitchTime >= this.switchInterval) {
            this.currentModelIndex = (this.currentModelIndex + 1) % items.length;
            this.lastSwitchTime = currentTime;
            this.material.uniforms.map.value = this.currentTexture[this.currentModelIndex];
            this.material.needsUpdate = true;
        }
        return items[this.currentModelIndex];
    }
    setObs() {
        return __awaiter(this, void 0, void 0, function* () {
            const obsArray = [];
            for (let i = 0; i < this.length; i++) {
                const x = i * this.size.w;
                obsArray.push(this.createCrow(x));
            }
            const obs = yield Promise.all(obsArray);
            this.obs.push(...obs);
            this.obsGroup.add(...obs);
        });
    }
    getObs() {
        return this.obs;
    }
    resetObs(obs) {
        let fObs = this.obs[0];
        for (const o of this.obs) {
            if (o.position.x > fObs.position.x) {
                fObs = o;
            }
        }
        obs.position.x = fObs.position.x + this.pos.gap();
        this.obsBox[this.obs.indexOf(obs)] = new THREE.Box3().setFromObject(obs);
    }
    loadShader(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield fetch(url);
            if (!res.ok)
                throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
            return yield res.text();
        });
    }
    update(deltaTime, collDetector) {
        if (!this.mesh || !this.material)
            return;
        this.deltaTime = deltaTime;
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        this.animateObs(this.models);
        for (let i = 0; i < this.obs.length; i++) {
            const o = this.obs[i];
            o.position.x -= this.speed * scaledDelta;
            const objBox = new THREE.Box3().setFromObject(o);
            if (collDetector.isColliding(objBox)) {
                this.resetObs(o);
                const updObjBox = new THREE.Box3().setFromObject(o);
                this.obsBox[i] = updObjBox;
            }
        }
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001 * this.tick.getTimeScale();
        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setObs();
            return this.obsGroup;
        });
    }
}
