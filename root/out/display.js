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
import { CollDetector } from './coll-detector.js';
import { Terrain } from './el/terrain.js';
import { Player } from './el/player.js';
export class Display {
    constructor(timeCycle, renderer, scene) {
        this.size = {
            w: 1.99,
            h: 1.8,
            d: 0.5
        };
        this.pos = {
            x: 0,
            y: -3.5,
            z: -3
        };
        this.timeCycle = timeCycle;
        this.renderer = renderer;
        this.collDetector = new CollDetector(scene);
        this.display = new THREE.Group;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
        this.createDisplay();
    }
    createDisplay() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [vertexShader, fragmentShader] = yield Promise.all([
                    this.loadShader('../main/shaders/displayVertexShader.glsl'),
                    this.loadShader('../main/shaders/displayFragShader.glsl'),
                ]);
                const path = '../../assets/obj/display.obj';
                const texPath = '../../assets/textures/display.png';
                const tex = this.texLoader.load(texPath);
                this.material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0.0 },
                        timeFactor: { value: 0.0 },
                        map: { value: tex },
                    },
                    vertexShader,
                    fragmentShader,
                    side: THREE.DoubleSide,
                    clipping: true
                });
                yield new Promise((res) => {
                    this.loader.load(path, (obj) => {
                        this.mesh = obj;
                        this.mesh.traverse((m) => {
                            if (m instanceof THREE.Mesh)
                                m.material = this.material;
                        });
                        this.mesh.renderOrder = 1;
                        this.mesh.scale.x = this.size.w;
                        this.mesh.scale.y = this.size.h;
                        this.mesh.position.x = this.pos.x,
                            this.mesh.position.y = this.pos.y,
                            this.mesh.position.z = this.pos.z;
                        const displayBox = new THREE.Box3().setFromObject(this.mesh);
                        const center = displayBox.getCenter(new THREE.Vector3());
                        const size = displayBox.getSize(new THREE.Vector3()).multiplyScalar(0.48);
                        const scaledBox = new THREE.Box3(center.clone().sub(size.clone()), center.clone().add(size.clone()));
                        this.collDetector.setZone(scaledBox);
                        res();
                    });
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
    _mainGroup() {
        return __awaiter(this, void 0, void 0, function* () {
            this.display = new THREE.Group();
            if (!this.mesh) {
                yield new Promise(res => {
                    const __check = () => this.mesh ? res(true) : setTimeout(__check, 0);
                    __check();
                });
            }
            this.display.add(this.mesh);
            //Render
            //Terrain
            this.renderTerrain = new Terrain(this.timeCycle);
            yield this.renderTerrain.ready();
            const terrainBlocks = this.renderTerrain.getTerrainBlocks();
            terrainBlocks.forEach(block => {
                block.renderOrder = 0;
                this.display.add(block);
                this.collDetector.addObject(block);
            });
            //Player
            this.renderPlayer = new Player(this.timeCycle);
            const playerObj = yield this.renderPlayer.ready();
            this.display.add(playerObj);
            this.collDetector.addObject(playerObj);
            //
            return this.display;
        });
    }
    update(deltaTime) {
        if (!this.material || !this.mesh)
            return;
        this.collDetector.checkBounds(); //if doenst work, switch later to below needsUpdate
        if (this.renderTerrain)
            this.renderTerrain.update(deltaTime, this.collDetector);
        if (this.renderPlayer)
            this.renderPlayer.update(deltaTime);
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001;
        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._mainGroup();
        });
    }
    //Resize
    handleResize() {
        this.size.w = this.size.w;
        this.size.h = this.size.h;
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
}
