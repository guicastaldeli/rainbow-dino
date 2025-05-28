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
import { Terrain } from './el/terrain.js';
import { Player } from './el/player.js';
export class Display {
    constructor(timeCycle) {
        this.size = {
            w: 13,
            h: 8,
            d: 0.1
        };
        this.pos = {
            x: 0,
            y: 0,
            z: -3
        };
        this.timeCycle = timeCycle;
        this.mainGroup = new THREE.Group;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
        this.createDisplay();
        this.display = this.ready();
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
                this.loader.load(path, (obj) => {
                    this.mesh = obj;
                    this.mesh.traverse((m) => {
                        if (m instanceof THREE.Mesh)
                            m.material = this.material;
                    });
                    this.mesh.position.x = this.pos.x,
                        this.mesh.position.y = this.pos.y,
                        this.mesh.position.z = this.pos.z;
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
            this.mainGroup = new THREE.Group();
            if (!this.mesh) {
                yield new Promise(res => {
                    const __checkMesh = () => {
                        if (this.mesh) {
                            res(true);
                            this.mainGroup.add(this.mesh);
                        }
                        else {
                            setTimeout(__checkMesh, 0);
                        }
                    };
                    __checkMesh();
                });
            }
            //Render
            //Terrain
            const renderTerrain = new Terrain();
            this.mainGroup.add(renderTerrain.mesh);
            //Player
            this.renderPlayer = new Player(this.timeCycle);
            const playerObj = yield this.renderPlayer.ready();
            this.mainGroup.add(playerObj);
            //
            return this.mainGroup;
        });
    }
    update(deltaTime) {
        if (this.renderPlayer)
            this.renderPlayer.update(deltaTime);
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
