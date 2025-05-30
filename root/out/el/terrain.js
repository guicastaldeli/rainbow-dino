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
    constructor(timeCycle, display) {
        this.blockGroup = new THREE.Group();
        this.blocks = [];
        this.speed = 1;
        this.length = 15;
        this.size = {
            w: 1,
            h: 1,
            d: 0.1,
            gap: 1.58
        };
        this.pos = {
            x: -7,
            y: -3,
            z: -3.1
        };
        this.timeCycle = timeCycle;
        this.display = display;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
    }
    createTerrain(x) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [vertexShader, fragmentShader] = yield Promise.all([
                    this.loadShader('./el/shaders/vertexShader.glsl'),
                    this.loadShader('./el/shaders/fragShader.glsl')
                ]);
                const path = '../../../assets/obj/terrain-block.obj';
                const texPath = '../../../assets/textures/terrain-block.png';
                const tex = this.texLoader.load(texPath);
                const bounds = this.display.getBounds();
                this.material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0.0 },
                        timeFactor: { value: 0.0 },
                        map: { value: tex },
                        bounds: { value: bounds.clone() }
                    },
                    vertexShader,
                    fragmentShader,
                    side: THREE.DoubleSide,
                    clipping: true
                });
                return new Promise((res) => {
                    this.loader.load(path, (obj) => __awaiter(this, void 0, void 0, function* () {
                        this.mesh = obj;
                        let block;
                        this.mesh.traverse((m) => {
                            if (m instanceof THREE.Mesh && !block) {
                                this.material.depthWrite = true;
                                this.material.depthTest = true;
                                m.material = this.material;
                                block = m;
                            }
                        });
                        if (!block)
                            throw new Error("err");
                        block.position.x = x * this.size.gap + this.pos.x;
                        block.position.y = this.pos.y;
                        block.position.z = this.pos.z;
                        res(block);
                    }));
                });
            }
            catch (err) {
                console.log(err);
                return Promise.reject(err);
            }
        });
    }
    setTerrain() {
        return __awaiter(this, void 0, void 0, function* () {
            const blockArray = [];
            for (let i = 0; i < this.length; i++) {
                const x = i * this.size.w;
                blockArray.push(this.createTerrain(x));
            }
            const block = yield Promise.all(blockArray);
            this.blocks.push(...block);
            this.blockGroup.add(...block);
        });
    }
    getTerrainBlocks() {
        return this.blocks;
    }
    resetBlock(block) {
        let fBlock = this.blocks[0];
        for (const b of this.blocks)
            if (b.position.x > fBlock.position.x)
                fBlock = b;
        block.position.x = fBlock.position.x + this.size.gap;
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
        if (!this.mesh)
            return;
        for (const b of this.blocks) {
            b.position.x -= this.speed * deltaTime;
            const objBox = new THREE.Box3().setFromObject(b);
            if (collDetector.isObjColliding(objBox))
                this.resetBlock(b);
        }
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001;
        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setTerrain();
            return this.blockGroup;
        });
    }
}
