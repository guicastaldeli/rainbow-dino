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
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/Addons.js';
export class Score {
    constructor(tick, timeCycle) {
        this.maxScore = 9999999;
        this.scoreMultiplier = 100;
        this.isBlinking = false;
        this.size = {
            s: 0.5,
            d: 0.02
        };
        this.pos = {
            x: 5,
            y: 3,
            z: -4
        };
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.loader = new FontLoader();
        this.loadFont();
        this.value = 0.0;
    }
    loadFont() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.data = yield new Promise((res, rej) => {
                    const path = '../../assets/fonts/HomeVideoRegular.json';
                    this.loader.load(path, (font) => res(font), undefined, (err) => rej(err));
                });
                this.createScore();
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
    createScore() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.data)
                    return;
                const [vertexShader, fragmentShader] = yield Promise.all([
                    this.loadShader('../main/shaders/scoreVertexShader.glsl'),
                    this.loadShader('../main/shaders/scoreFragShader.glsl')
                ]);
                const text = Math.floor(this.value).toString().padStart(7, '0');
                const geometry = new TextGeometry(text, {
                    font: this.data,
                    size: this.size.s,
                    depth: this.size.d,
                    bevelEnabled: false,
                });
                this.material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0.0 },
                        timeFactor: { value: 0.0 },
                        shouldBlink: { value: false }
                    },
                    vertexShader,
                    fragmentShader,
                    side: THREE.DoubleSide
                });
                if (!this.mesh) {
                    this.mesh = new THREE.Mesh(geometry, this.material);
                }
                else {
                    this.mesh.geometry = geometry;
                    this.mesh.material = this.material;
                }
                this.mesh.position.x = this.pos.x;
                this.mesh.position.y = this.pos.y;
                this.mesh.position.z = this.pos.z;
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
    getScore() {
        if (!this.mesh)
            throw new Error('mesh err');
        return this.mesh;
    }
    getCurrentScore() {
        return Math.floor(this.value);
    }
    saveScore() {
        this.finalScore = this.getCurrentScore();
        localStorage.setItem('final-score', this.finalScore.toString());
        return this.finalScore;
    }
    getFinalScore() {
        return this.saveScore();
    }
    activateBlink() {
        if (this.isBlinking) {
            this.material.uniforms.shouldBlink.value = this.isBlinking;
        }
    }
    updateValue() {
        const scrollSpeed = Math.max(this.timeCycle.updateSpeed(), 0.1);
        const increment = (0.0005 * this.scoreMultiplier) * scrollSpeed;
        const updValue = Math.min(this.value + increment, this.maxScore);
        if (this.tick.getTimeScale() > 0) {
            const prevThousands = Math.floor(this.value / 100);
            const newThousands = Math.floor(updValue / 100);
            if (newThousands > prevThousands) {
                this.isBlinking = true;
                this.activateBlink();
                setTimeout(() => {
                    this.isBlinking = false;
                }, 1000);
            }
            this.value = updValue;
        }
        return this.value;
    }
    loadShader(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield fetch(url);
            if (!res.ok)
                throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
            return res.text();
        });
    }
    update(deltaTime) {
        if (!this.mesh || !this.data)
            return;
        this.createScore();
        this.updateValue();
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001 * this.tick.getTimeScale();
        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                while (!this.mesh)
                    yield new Promise(res => setTimeout(res, 100));
                return this.getScore();
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
}
