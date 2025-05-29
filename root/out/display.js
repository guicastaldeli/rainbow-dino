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
import { ClipDetector } from './clip-detector.js';
import { Terrain } from './el/terrain.js';
import { Player } from './el/player.js';
export class Display {
    constructor(timeCycle, renderer) {
        this.clipDetector = new ClipDetector();
        this.size = {
            w: 2,
            h: 1.8,
            d: 0.1
        };
        this.pos = {
            x: 0,
            y: -3.5,
            z: -3
        };
        this.timeCycle = timeCycle;
        this.renderer = renderer;
        this.renderer.localClippingEnabled = true;
        this.display = new THREE.Group;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
        this.clippingPlanes = [
            new THREE.Plane(new THREE.Vector3(1, 0, 0)), //Right
            new THREE.Plane(new THREE.Vector3(-1, 0, 0)), //Left
            new THREE.Plane(new THREE.Vector3(0, 1, 0)), //Top
            new THREE.Plane(new THREE.Vector3(0, -1, 0)), //Bottom
            new THREE.Plane(new THREE.Vector3(0, 0, -1)),
        ];
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
                        map: { value: tex }
                    },
                    vertexShader,
                    fragmentShader,
                    side: THREE.DoubleSide
                });
                yield new Promise((res) => {
                    this.loader.load(path, (obj) => {
                        this.mesh = obj;
                        this.mesh.traverse((m) => {
                            if (m instanceof THREE.Mesh)
                                m.material = this.material;
                        });
                        this.mesh.scale.x = this.size.w;
                        this.mesh.scale.y = this.size.h;
                        this.mesh.position.x = this.pos.x,
                            this.mesh.position.y = this.pos.y,
                            this.mesh.position.z = this.pos.z;
                        this.updateClipping();
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
    updateClipping() {
        if (!this.mesh)
            return;
        this.clipDetector.updateBounds(this.mesh, this.size);
    }
    _applyClipping(obj) {
        obj.traverse(o => {
            if (o instanceof THREE.Mesh) {
                const mat = Array.isArray(o.material) ? o.material : [o.material];
                const updMat = mat.map(m => {
                    const newMat = m.clone();
                    newMat.clippingPlanes = this.clippingPlanes;
                    return newMat;
                });
                o.material = Array.isArray(o.material) ? updMat : updMat[0];
            }
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
            this._applyClipping(this.display);
            //Render
            //Terrain
            const renderTerrain = new Terrain();
            this._applyClipping(renderTerrain.mesh);
            this.display.add(renderTerrain.mesh);
            //Player
            this.renderPlayer = new Player(this.timeCycle);
            const playerObj = yield this.renderPlayer.ready();
            this._applyClipping(playerObj);
            this.display.add(playerObj);
            //
            this.updateClipping();
            return this.display;
        });
    }
    update(deltaTime) {
        if (!this.material || !this.mesh)
            return;
        if (this.renderPlayer)
            this.renderPlayer.update(deltaTime);
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001;
        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate;
        this.updateClipping();
        this.clipDetector.checkAllObjs(this.display);
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
