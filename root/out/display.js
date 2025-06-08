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
import { Lightning } from './lightning.js';
import { CollDetector } from './coll-detector.js';
import { Terrain } from './el/terrain.js';
import { Clouds } from './el/clouds.js';
import { ObstacleManager } from './el/obstacle-manager.js';
import { Cactus } from './el/cactus.js';
import { Crow } from './el/crow.js';
import { Player } from './el/player.js';
export class Display {
    constructor(tick, timeCycle, renderer, scene) {
        this.obstacleManager = new ObstacleManager();
        this.size = {
            w: 0.52,
            h: 0.51,
            d: 2.5
        };
        this.pos = {
            x: 0,
            y: -3.75,
            z: -3.05
        };
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.renderer = renderer;
        //Lightning
        this.lightning = new Lightning(this.tick, this.timeCycle);
        this.ambientLightColor = this.lightning.getColor();
        this.ambientLightIntensity = this.lightning['intensity'];
        this.directionalLight = this.lightning['directionalLight'];
        this.directionalLightColor = this.lightning['dlColor'];
        this.directionalLightIntensity = this.lightning['dlIntensity'];
        this.directionalLightPosition = this.lightning['dlPosition'];
        //
        this.display = new THREE.Group;
        this.loader = new OBJLoader();
        this.collDetector = new CollDetector(scene);
        this.texLoader = new THREE.TextureLoader();
        this.scene = scene;
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
                        bounds: { value: new THREE.Vector4() },
                        shadowMap: { value: null },
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
                    clipping: true
                });
                yield new Promise((res) => {
                    this.loader.load(path, (obj) => {
                        this.mesh = obj;
                        this.mesh.traverse((m) => {
                            if (m instanceof THREE.Mesh) {
                                m.material = this.material;
                                m.castShadow = true;
                                m.receiveShadow = true;
                            }
                        });
                        this.mesh.scale.x = this.size.w;
                        this.mesh.scale.y = this.size.h;
                        this.mesh.scale.z = this.size.d;
                        this.mesh.position.x = this.pos.x,
                            this.mesh.position.y = this.pos.y,
                            this.mesh.position.z = this.pos.z;
                        this.mesh.receiveShadow = true;
                        if (this.display) {
                            const bounds = this.getBounds();
                            this.material.uniforms.bounds.value.copy(bounds);
                        }
                        res();
                    });
                });
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    getBounds() {
        const displayBox = new THREE.Box3().setFromObject(this.mesh);
        this.collDetector.setZone(displayBox);
        this.collDetector.outDisplayBounds(displayBox);
        const min = displayBox.min;
        const max = displayBox.max;
        const bounds = new THREE.Vector4(min.x, max.x, min.y, max.y);
        this.material.uniforms.bounds.value = bounds;
        return bounds;
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
            //Render
            //Display
            this.display.add(this.mesh);
            //Clouds
            this.renderClouds = new Clouds(this.tick, this.timeCycle, this);
            yield this.renderClouds.ready();
            const clouds = this.renderClouds.getClouds();
            clouds.forEach(c => {
                this.display.add(c);
            });
            //Terrain
            this.renderTerrain = new Terrain(this.tick, this.timeCycle, this);
            yield this.renderTerrain.ready();
            const terrainBlocks = this.renderTerrain.getTerrainBlocks();
            terrainBlocks.forEach(block => {
                this.display.add(block);
            });
            //Obstacles
            //Cactus
            this.renderCactus = new Cactus(this.tick, this.timeCycle, this);
            yield this.renderCactus.ready();
            const cactus = this.renderCactus.getObs();
            cactus.forEach(c => {
                this.display.add(c);
            });
            this.obstacleManager.addObstacle(cactus);
            //
            //Crow
            this.renderCrow = new Crow(this.tick, this.timeCycle, this);
            yield this.renderCrow.ready();
            const crow = this.renderCrow.getObs();
            crow.forEach(c => {
                this.display.add(c);
            });
            this.obstacleManager.addObstacle(crow);
            //
            //
            //Player
            this.renderPlayer = new Player(this.tick, this.timeCycle, this.collDetector, this.obstacleManager.getObstacles());
            const playerObj = yield this.renderPlayer.ready();
            this.display.add(playerObj);
            //
            return this.display;
        });
    }
    update(deltaTime) {
        if (!this.material || !this.mesh)
            return;
        if (this.renderClouds)
            this.renderClouds.update(deltaTime, this.collDetector);
        if (this.renderTerrain)
            this.renderTerrain.update(deltaTime, this.collDetector);
        if (this.renderCactus)
            this.renderCactus.update(deltaTime, this.collDetector);
        if (this.renderCrow)
            this.renderCrow.update(deltaTime, this.collDetector);
        if (this.renderPlayer)
            this.renderPlayer.update(deltaTime);
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001;
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
