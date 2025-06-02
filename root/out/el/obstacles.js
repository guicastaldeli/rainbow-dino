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
export class Obstacles {
    constructor(timeCycle, display) {
        this.obsGroup = new THREE.Group();
        this.obs = [];
        this.speed = 1;
        this.length = 20;
        this.size = {
            w: 1,
            h: 1,
            d: 0.1,
            gap: () => Math.random() * (32 - 16) + 16
        };
        this.pos = {
            x: 8,
            y: -3,
            z: -3.1
        };
        this.timeCycle = timeCycle;
        this.display = display;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
    }
    createObstacles(x) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [vertexShader, fragmentShader] = yield Promise.all([
                    this.loadShader('./el/shaders/vertexShader.glsl'),
                    this.loadShader('./el/shaders/fragShader.glsl')
                ]);
                const models = [
                    {
                        model: '../../../assets/obj/cactus1.obj',
                        tex: '../../../assets/textures/cactus1.png',
                        chance: 0.5
                    },
                    {
                        model: '../../../assets/obj/cactus2.obj',
                        tex: '../../../assets/textures/cactus2.png',
                        chance: 0.5
                    }
                ];
                const selectedModel = this.randomObjs(models);
                const tex = yield this.texLoader.loadAsync(selectedModel.tex);
                const bounds = this.display.getBounds();
                this.material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0.0 },
                        timeFactor: { value: 0.0 },
                        map: { value: tex },
                        bounds: { value: bounds.clone() },
                        isObs: { value: true }
                    },
                    vertexShader,
                    fragmentShader,
                    side: THREE.DoubleSide
                });
                return new Promise((res) => {
                    this.loader.load(selectedModel.model, (obj) => __awaiter(this, void 0, void 0, function* () {
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
                        obs.position.x = (x * this.size.gap()) + this.pos.x;
                        obs.position.y = this.pos.y;
                        obs.position.z = this.pos.z;
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
    randomObjs(items) {
        let totalChance = items.reduce((sum, item) => sum + item.chance, 0);
        let random = Math.random() * totalChance;
        let current = 0;
        for (let item of items) {
            if (random <= item.chance + current)
                return item;
            current += item.chance;
        }
        return items[0];
    }
    setObstacles() {
        return __awaiter(this, void 0, void 0, function* () {
            const obsArray = [];
            for (let i = 0; i < this.length; i++) {
                const x = i * this.size.w;
                obsArray.push(this.createObstacles(x));
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
        obs.position.x = fObs.position.x + this.size.gap();
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
        for (const o of this.obs) {
            o.position.x -= this.speed * deltaTime;
            const objBox = new THREE.Box3().setFromObject(o);
            if (collDetector.isObjColliding(objBox))
                this.resetObs(o);
        }
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001;
        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setObstacles();
            return this.obsGroup;
        });
    }
}
