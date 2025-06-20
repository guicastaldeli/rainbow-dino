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
import { Lightning } from '../lightning.js';
export class Cactus {
    constructor(tick, timeCycle, display, obstacleManager) {
        this.materials = [];
        this.obs = [];
        this.obsBox = [];
        this.obsGroup = new THREE.Group();
        this.length = 20;
        this.size = {
            w: 1,
            h: 1,
            d: 1,
        };
        this.pos = {
            x: 8,
            y: -3,
            z: -3.23,
            gap: () => Math.random() * (32 - 16) + 16,
            minDistance: 16
        };
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.display = display;
        this.obstacleManager = obstacleManager;
        //Lightning
        this.lightning = new Lightning(this.tick, this.timeCycle);
        this.ambientLightColor = this.lightning.getColor();
        this.ambientLightIntensity = this.lightning.getAmbientLightIntensity();
        this.directionalLight = this.lightning.getDirectionalLight();
        this.directionalLightColor = this.lightning.getDirectionalLightColor();
        this.directionalLightIntensity = this.lightning.getDirectionalLightIntensity();
        this.directionalLightPosition = this.lightning.getDirectionalLightPos();
        //
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
    }
    createCactus(x) {
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
                const material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0.0 },
                        timeFactor: { value: this.timeCycle.getTimeFactor() },
                        map: { value: tex },
                        bounds: { value: bounds.clone() },
                        isObs: { value: true },
                        isCloud: { value: false },
                        shadowMap: { value: null },
                        shadowBias: { value: 0.01 },
                        shadowRadius: { value: 1.0 },
                        ambientLightColor: { value: this.ambientLightColor },
                        ambientLightIntensity: { value: this.ambientLightIntensity },
                        directionalLightColor: { value: this.directionalLightColor },
                        directionalLightIntensity: { value: this.directionalLightIntensity },
                        directionalLightPosition: { value: this.directionalLightPosition },
                        directionalLightMatrix: { value: new THREE.Matrix4() }
                    },
                    vertexShader,
                    fragmentShader,
                    side: THREE.DoubleSide,
                });
                this.materials.push(material);
                return new Promise((res) => {
                    this.loader.load(selectedModel.model, (obj) => __awaiter(this, void 0, void 0, function* () {
                        this.mesh = obj;
                        let obs;
                        this.mesh.traverse((m) => {
                            if (m instanceof THREE.Mesh && !obs) {
                                m.material = material;
                                m.receiveShadow = true;
                                m.castShadow = true;
                                obs = m;
                            }
                        });
                        if (!obs)
                            throw new Error('err');
                        const cactusMesh = obs;
                        cactusMesh.type = 'cactus';
                        cactusMesh.scale.x = this.size.w;
                        cactusMesh.scale.y = this.size.h;
                        cactusMesh.scale.z = this.size.d;
                        cactusMesh.position.x = (x * this.pos.gap()) + this.pos.x;
                        cactusMesh.position.y = this.pos.y;
                        cactusMesh.position.z = this.pos.z;
                        const box = new THREE.Box3().setFromObject(cactusMesh);
                        this.obsBox.push(box);
                        res(cactusMesh);
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
    setObs() {
        return __awaiter(this, void 0, void 0, function* () {
            const obsArray = [];
            for (let i = 0; i < this.length; i++)
                obsArray.push(this.createCactus(i));
            const obs = yield Promise.all(obsArray);
            this.obs.push(...obs);
            this.obsGroup.add(...obs);
            requestAnimationFrame(() => {
                this.obstacleManager.addObstacle(obs);
            });
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
        let newX = fObs.position.x + this.pos.gap();
        let attempts = 0;
        let maxAttempts = 10;
        while (attempts < maxAttempts) {
            const tempBox = new THREE.Box3().setFromObject(obs);
            tempBox.translate(new THREE.Vector3(newX - obs.position.x, 0, 0));
            let overlaps = false;
            for (const box of this.obsBox) {
                if (tempBox.intersectsBox(box)) {
                    overlaps = true;
                    break;
                }
            }
            if (!overlaps)
                break;
            newX += this.pos.minDistance;
            attempts++;
        }
        ;
        obs.position.x = newX;
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
    resetState() {
        return __awaiter(this, void 0, void 0, function* () {
            this.materials.forEach(m => m.dispose());
            this.materials = [];
            this.obs.forEach(obs => {
                if (obs.geometry)
                    obs.geometry.dispose();
                if (obs.material && !Array.isArray(obs.material))
                    obs.material.dispose();
            });
            this.obstacleManager.clearObstacles();
            this.obs = [];
            this.obsBox = [];
            this.obsGroup.clear();
            yield this.setObs();
            this.obsBox = this.obs.map(o => new THREE.Box3().setFromObject(o));
            const factor = this.timeCycle.getTimeFactor();
            const totalTime = performance.now() * this.timeCycle['initSpeed'] * this.tick.getTimeScale();
            const ambientColor = this.lightning.update(factor);
            this.materials.forEach(material => {
                material.uniforms.time.value = totalTime;
                material.uniforms.timeFactor.value = factor;
                material.uniforms.ambientLightColor.value = ambientColor;
                material.uniforms.ambientLightIntensity.value = this.ambientLightIntensity;
                material.uniforms.directionalLightColor.value = this.directionalLightColor;
                material.uniforms.directionalLightIntensity.value = this.directionalLightIntensity;
                material.uniforms.directionalLightPosition.value = this.directionalLightPosition;
                material.uniforms.directionalLightMatrix.value = this.directionalLight.shadow.matrix;
                material.needsUpdate = true;
            });
            return this.obsGroup;
        });
    }
    update(deltaTime, collDetector) {
        if (!this.mesh || !this.materials)
            return;
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        const speed = this.timeCycle['scrollSpeed'];
        for (let i = 0; i < this.obs.length; i++) {
            const o = this.obs[i];
            o.position.x -= speed * scaledDelta;
            const objBox = new THREE.Box3().setFromObject(o);
            if (collDetector.isColliding(objBox)) {
                this.resetObs(o);
                const updObjBox = new THREE.Box3().setFromObject(o);
                this.obsBox[i] = updObjBox;
            }
        }
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * this.timeCycle['initSpeed'] * this.tick.getTimeScale();
        const ambientColor = this.lightning.update(factor);
        this.materials.forEach(material => {
            material.uniforms.time.value = totalTime;
            material.uniforms.timeFactor.value = factor;
            material.uniforms.ambientLightColor.value = ambientColor;
            material.uniforms.ambientLightIntensity.value = this.ambientLightIntensity;
            material.uniforms.directionalLightColor.value = this.directionalLightColor;
            material.uniforms.directionalLightIntensity.value = this.directionalLightIntensity;
            material.uniforms.directionalLightPosition.value = this.directionalLightPosition;
            material.uniforms.directionalLightMatrix.value = this.directionalLight.shadow.matrix;
            material.needsUpdate = true;
        });
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setObs();
            return this.obsGroup;
        });
    }
}
