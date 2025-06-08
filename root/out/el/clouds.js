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
export class Clouds {
    constructor(tick, timeCycle, display) {
        this.lightning = new Lightning();
        this.ambientLightColor = this.lightning['color'];
        this.ambientLightIntensity = this.lightning['intensity'];
        this.directionalLight = this.lightning['directionalLight'];
        this.directionalLightColor = this.lightning['dlColor'];
        this.directionalLightIntensity = this.lightning['dlIntensity'];
        this.directionalLightPosition = this.lightning['dlPosition'];
        this.cloudGroup = new THREE.Group();
        this.clouds = [];
        this.length = 30;
        this.size = {
            w: 0.5,
            h: 0.5,
            d: 0.5
        };
        this.pos = {
            x: -4,
            y: 0,
            z: () => Math.random() * ((-3.45) - (-3.1)) + (-3.1),
            gapX: () => Math.random() * (20 - 2) + 2,
            gapY: () => Math.random() * (0.5 - (-0.5)) + (-0.5)
        };
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.display = display;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
    }
    createClouds(x, y) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [vertexShader, fragmentShader] = yield Promise.all([
                    this.loadShader('./el/shaders/vertexShader.glsl'),
                    this.loadShader('./el/shaders/fragShader.glsl')
                ]);
                const models = [
                    {
                        model: '../../../assets/obj/cloud1.obj',
                        chance: 0.6,
                    },
                    {
                        model: '../../../assets/obj/cloud2.obj',
                        chance: 0.4
                    }
                ];
                const selectedModel = this.randomObjs(models);
                const texPath = '../../../assets/textures/cloud.png';
                const tex = yield this.texLoader.loadAsync(texPath);
                const bounds = this.display.getBounds();
                this.material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0.0 },
                        timeFactor: { value: 0.0 },
                        map: { value: tex },
                        bounds: { value: bounds.clone() },
                        isObs: { value: false },
                        isCloud: { value: true },
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
                    transparent: true,
                });
                return new Promise((res) => {
                    this.loader.load(selectedModel.model, (obj) => __awaiter(this, void 0, void 0, function* () {
                        this.mesh = obj;
                        let clouds;
                        this.mesh.traverse((m) => {
                            if (m instanceof THREE.Mesh && !clouds) {
                                m.material = this.material;
                                m.receiveShadow = true;
                                m.castShadow = true;
                                clouds = m;
                            }
                        });
                        if (!clouds)
                            return new Error('err');
                        clouds.scale.x = this.size.w;
                        clouds.scale.y = this.size.h;
                        clouds.scale.z = this.size.d;
                        clouds.position.x = (x * this.pos.gapX()) + this.pos.x;
                        clouds.position.y = (y * this.pos.gapY()) + this.pos.y;
                        clouds.position.z = this.pos.z();
                        res(clouds);
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
    setClouds() {
        return __awaiter(this, void 0, void 0, function* () {
            const cloudsArray = [];
            for (let i = 0; i < this.length; i++) {
                const x = i * this.size.w;
                const y = i * this.size.h;
                cloudsArray.push(this.createClouds(x, y));
            }
            const obj = yield Promise.all(cloudsArray);
            this.clouds.push(...obj);
            this.cloudGroup.add(...obj);
        });
    }
    getClouds() {
        return this.clouds;
    }
    resetCloud(cloud) {
        let fCloud = this.clouds[0];
        for (const c of this.clouds) {
            if (c.position.x > fCloud.position.x) {
                fCloud = c;
            }
        }
        cloud.position.x = fCloud.position.x + this.pos.gapX();
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
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        const speed = this.timeCycle['scrollSpeed'] / 2;
        for (const c of this.clouds) {
            c.position.x -= speed * scaledDelta;
            const objBox = new THREE.Box3().setFromObject(c);
            if (collDetector.isColliding(objBox))
                this.resetCloud(c);
        }
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * this.timeCycle['initSpeed'] * this.tick.getTimeScale();
        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.uniforms.ambientLightColor.value = this.ambientLightColor;
        this.material.uniforms.ambientLightIntensity.value = this.ambientLightIntensity;
        this.material.uniforms.directionalLightColor.value = this.directionalLightColor;
        this.material.uniforms.directionalLightIntensity.value = this.directionalLightIntensity;
        this.material.uniforms.directionalLightMatrix.value = this.directionalLight.shadow.matrix;
        this.material.needsUpdate = true;
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setClouds();
            return this.cloudGroup;
        });
    }
}
