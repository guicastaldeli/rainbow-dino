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
export class Crow {
    constructor(tick, timeCycle, display) {
        this.lightning = new Lightning();
        this.ambientLightColor = this.lightning['color'];
        this.ambientLightIntensity = this.lightning['intensity'];
        this.directionalLight = this.lightning['directionalLight'];
        this.directionalLightColor = this.lightning['dlColor'];
        this.directionalLightIntensity = this.lightning['dlIntensity'];
        this.directionalLightPosition = this.lightning['dlPosition'];
        this.obs = [];
        this.obsBox = [];
        this.obsGroup = new THREE.Group();
        this.length = 10;
        this.currentModelIndex = 0;
        this.lastSwitchTime = 0;
        this.switchInterval = 0.5;
        this.geometries = [];
        this.currentTexture = [];
        this.models = [];
        this.size = {
            w: 1,
            h: 1,
            d: 1
        };
        this.pos = {
            x: 0,
            y: () => Math.random() * (0.5 - (-1)) + (-1),
            z: -3.2,
            gap: () => Math.random() * (32 - 16) + 16
        };
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.display = display;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
        //Models
        this.models = [
            {
                geometry: this.loadModel('../../../assets/obj/crow1.obj'),
                tex: this.texLoader.loadAsync('../../../assets/textures/crow1.png')
            },
            {
                geometry: this.loadModel('../../../assets/obj/crow2.obj'),
                tex: this.texLoader.loadAsync('../../../assets/textures/crow2.png')
            }
        ];
    }
    loadModel(url) {
        return new Promise((res) => {
            this.loader.load(url, (obj) => {
                let geometry;
                obj.traverse((o) => {
                    if (o instanceof THREE.Mesh && !geometry) {
                        geometry = o.geometry;
                        o.receiveShadow = true;
                        o.castShadow = true;
                    }
                });
                if (!geometry)
                    throw new Error('No geometry found');
                res(geometry);
            });
        });
    }
    createCrow(x) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [vertexShader, fragmentShader, tex, geometry] = yield Promise.all([
                    this.loadShader('./el/shaders/vertexShader.glsl'),
                    this.loadShader('./el/shaders/fragShader.glsl'),
                    this.models[this.currentModelIndex].tex,
                    this.models[this.currentModelIndex].geometry
                ]);
                const bounds = this.display.getBounds();
                const material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0.0 },
                        timeFactor: { value: 0.0 },
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
                    side: THREE.DoubleSide
                });
                const mesh = new THREE.Mesh(geometry.clone(), material);
                const crowMesh = mesh;
                crowMesh.scale.x = this.size.w;
                crowMesh.scale.x = this.size.h;
                crowMesh.scale.x = this.size.d;
                crowMesh.position.x = (x * this.pos.gap()) + this.pos.x;
                crowMesh.position.y = this.pos.y();
                crowMesh.position.z = this.pos.z;
                crowMesh.receiveShadow = true;
                const box = new THREE.Box3().setFromObject(crowMesh);
                this.obsBox.push(box);
                return crowMesh;
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
    animateObs() {
        if (this.tick['paused'] || this.tick['gameover'])
            return;
        const currentTime = performance.now() * this.timeCycle['initSpeed'];
        if (currentTime - this.lastSwitchTime >= this.switchInterval) {
            this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
            this.lastSwitchTime = currentTime;
            Promise.all(this.models.map(m => Promise.all([m.geometry, m.tex])))
                .then(() => {
                this.obs.forEach((crow) => __awaiter(this, void 0, void 0, function* () {
                    const model = this.models[this.currentModelIndex];
                    const [geometry, tex] = yield Promise.all([
                        model.geometry,
                        model.tex
                    ]);
                    crow.geometry.dispose();
                    crow.geometry = geometry.clone();
                    if (crow.material instanceof THREE.ShaderMaterial) {
                        crow.material.uniforms.map.value = tex;
                        crow.material.needsUpdate = true;
                    }
                }));
            });
        }
    }
    setObs() {
        return __awaiter(this, void 0, void 0, function* () {
            const obsArray = [];
            for (let i = 0; i < this.length; i++)
                obsArray.push(this.createCrow(i));
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
        obs.position.x = fObs.position.x + this.pos.gap();
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
    update(deltaTime, collDetector) {
        if (this.obs.length === 0)
            return;
        this.deltaTime = deltaTime;
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * this.timeCycle['initSpeed'] * this.tick.getTimeScale();
        const speed = this.timeCycle['scrollSpeed'] * 1.5;
        this.animateObs();
        this.obs.forEach((o, i) => {
            o.position.x -= speed * scaledDelta;
            const objBox = new THREE.Box3().setFromObject(o);
            if (o.material instanceof THREE.ShaderMaterial) {
                o.material.uniforms.time.value = totalTime;
                o.material.uniforms.timeFactor.value = factor;
                o.material.uniforms.ambientLightColor.value = this.ambientLightColor;
                o.material.uniforms.ambientLightIntensity.value = this.ambientLightIntensity;
                o.material.uniforms.directionalLightColor.value = this.directionalLightColor;
                o.material.uniforms.directionalLightIntensity.value = this.directionalLightIntensity;
                o.material.uniforms.directionalLightMatrix.value = this.directionalLight.shadow.matrix;
                o.material.needsUpdate = true;
            }
            if (collDetector.isColliding(objBox)) {
                this.resetObs(o);
                this.obsBox[i] = new THREE.Box3().setFromObject(o);
            }
        });
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setObs();
            return this.obsGroup;
        });
    }
}
