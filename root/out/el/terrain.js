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
export class Terrain {
    constructor(tick, timeCycle, display) {
        this.blocks = [];
        this.blockGroup = new THREE.Group();
        this.length = 20;
        this.size = {
            w: 1,
            h: 1,
            d: 1,
        };
        this.pos = {
            x: -15,
            y: -3,
            z: -3.1,
            gap: 1
        };
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.display = display;
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
                        isCloud: { value: false }
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
                            block = m;
                        }
                    });
                    if (!block)
                        throw new Error("err");
                    block.scale.x = this.size.w;
                    block.scale.y = this.size.h;
                    block.scale.z = this.size.d;
                    block.position.x = x * this.pos.gap + this.pos.x;
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
    resetBlock(b) {
        let fx = this.blocks[0];
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i];
            if (block.position.x > fx.position.x)
                fx = block;
        }
        b.position.x = fx.position.x + (this.pos.gap * this.size.w);
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
        const speed = this.timeCycle['scrollSpeed'];
        for (let i = 0; i < this.blocks.length; i++) {
            const b = this.blocks[i];
            const box = new THREE.Box3().setFromObject(b);
            this.movBlocks(b, speed, scaledDelta);
            if (collDetector.isColliding(box))
                this.resetBlock(b);
        }
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * this.timeCycle['initSpeed'] * this.tick.getTimeScale();
        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
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
