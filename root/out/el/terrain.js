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
export class Terrain {
    constructor(tick, timeCycle, display) {
        this.blocks = [];
        this.blockGroup = new THREE.Group();
        this.length = 15;
        this.size = {
            w: 1,
            h: 1,
            d: 1.6,
        };
        this.pos = {
            x: -10,
            y: -3,
            z: -3.1,
            gap: () => 1.6
        };
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.display = display;
        //Lightning
        this.lightning = new Lightning(this.tick, this.timeCycle);
        this.ambientLightColor = this.lightning.getColor();
        this.ambientLightIntensity = this.lightning['intensity'];
        this.directionalLight = this.lightning['directionalLight'];
        this.directionalLightColor = this.lightning['dlColor'];
        this.directionalLightIntensity = this.lightning['dlIntensity'];
        this.directionalLightPosition = this.lightning['dlPosition'];
        //
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
    }
    initMaterial() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [vertexShader, fragmentShader] = yield Promise.all([
                    this.loadShader('./el/shaders/vertexShader.glsl'),
                    this.loadShader('./el/shaders/fragShader.glsl')
                ]);
                const texPath = '../../../assets/textures/terrain-block.png';
                const tex = yield this.texLoader.loadAsync(texPath);
                const bounds = this.display.getBounds();
                this.material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0.0 },
                        timeFactor: { value: 0.0 },
                        map: { value: tex },
                        bounds: { value: bounds.clone() },
                        isObs: { value: false },
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
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    createTerrain(x) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = '../../../assets/obj/terrain-block.obj';
            return new Promise((res, rej) => {
                this.loader.load(path, (obj) => __awaiter(this, void 0, void 0, function* () {
                    this.mesh = obj;
                    let block;
                    this.mesh.traverse((m) => {
                        if (m instanceof THREE.Mesh && !block) {
                            m.material = this.material;
                            m.castShadow = true;
                            m.receiveShadow = true;
                            block = m;
                        }
                    });
                    if (!block)
                        throw new Error("err");
                    block.scale.x = this.size.w;
                    block.scale.y = this.size.h;
                    block.scale.z = this.size.d;
                    block.position.x = this.pos.x + (x * this.size.w * this.pos.gap());
                    block.position.y = this.pos.y;
                    block.position.z = this.pos.z;
                    res(block);
                }), undefined, rej);
            });
        });
    }
    setTerrain() {
        return __awaiter(this, void 0, void 0, function* () {
            const bArray = [];
            for (let i = 0; i < this.length; i++)
                bArray.push(this.createTerrain(i));
            const b = yield Promise.all(bArray);
            this.blocks.push(...b);
            this.blockGroup.add(...b);
        });
    }
    getTerrainBlocks() {
        return this.blocks;
    }
    movBlocks(b, speed, scaledDelta) {
        b.position.x -= speed * scaledDelta;
    }
    resetBlocks(b, speed, scaledDelta) {
        let fx = this.blocks[0];
        this.blocks.forEach(block => {
            const x = block.position.x - (speed * scaledDelta);
            if (x > fx.position.x)
                fx = block;
        });
        const updX = fx.position.x + (this.size.w * this.pos.gap()) - (speed * scaledDelta);
        b.position.x = updX;
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
        if (!this.mesh || !this.material || this.blocks.length !== this.length)
            return;
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        const speed = this.timeCycle['scrollSpeed'];
        for (let i = 0; i < this.blocks.length; i++) {
            const b = this.blocks[i];
            const box = new THREE.Box3().setFromObject(b);
            this.movBlocks(b, speed, scaledDelta);
            if (collDetector.isColliding(box))
                this.resetBlocks(b, speed, scaledDelta);
        }
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * this.timeCycle['initSpeed'] * this.tick.getTimeScale();
        const ambientColor = this.lightning.update(factor);
        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.uniforms.ambientLightColor.value = ambientColor;
        this.material.uniforms.ambientLightIntensity.value = this.ambientLightIntensity;
        this.material.uniforms.directionalLightColor.value = this.directionalLightColor;
        this.material.uniforms.directionalLightIntensity.value = this.directionalLightIntensity;
        this.material.uniforms.directionalLightPosition.value = this.directionalLightPosition;
        this.material.uniforms.directionalLightMatrix.value = this.directionalLight.shadow.matrix;
        this.material.needsUpdate = true;
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.initMaterial();
                yield this.setTerrain();
                return this.blockGroup;
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
}
