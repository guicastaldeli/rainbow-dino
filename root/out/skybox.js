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
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export class Skybox {
    constructor(timeCycle, count = 300) {
        this.geometries = [];
        this.timeCycle = timeCycle;
        this.generateStars(count);
    }
    loadShaders() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [vertexShader, fragmentShader, starVertexShader, starFragShader] = yield Promise.all([
                    this.loadShader('../main/shaders/vertexShader.glsl'),
                    this.loadShader('../main/shaders/fragShader.glsl'),
                    this.loadShader('../main/shaders/starVertexShader.glsl'),
                    this.loadShader('../main/shaders/starFragShader.glsl')
                ]);
                this.skyboxMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        timeFactor: { value: 0.0 },
                        resolution: {
                            value: new THREE.Vector2(window.innerWidth, window.innerHeight)
                        }
                    },
                    vertexShader,
                    fragmentShader,
                    side: THREE.DoubleSide
                });
                this.starsMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        timeFactor: { value: 0.0 },
                        time: { value: 0 },
                        size: { value: 0.3 }
                    },
                    vertexShader: starVertexShader,
                    fragmentShader: starFragShader,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const geometry = new THREE.BoxGeometry(110, 110, 110);
                this.mesh = new THREE.Mesh(geometry, this.skyboxMaterial);
                const mergedGeometry = mergeGeometries(this.geometries);
                this.geometries.forEach(g => g.dispose());
                this.geometries = [];
                this.points = new THREE.Points(mergedGeometry, this.starsMaterial);
                this.mesh.add(this.points);
                return {
                    skybox: this.mesh,
                    stars: this.points
                };
            }
            catch (error) {
                console.error(error);
                throw error;
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
    //Stars
    generateStars(count, chunks = 1) {
        const starChunk = Math.ceil(count / chunks);
        this.geometries = [];
        for (let i = 0; i < chunks; i++) {
            const geometry = new THREE.BufferGeometry();
            const remChunk = count - (i * starChunk);
            const chunkCount = i === chunks - 1 ? remChunk : starChunk;
            const { pos, color, scale, phase, } = this.createStars(chunkCount);
            geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(color, 3));
            geometry.setAttribute('scale', new THREE.BufferAttribute(scale, 1));
            geometry.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
            this.geometries.push(geometry);
        }
    }
    createStars(count) {
        const pos = new Float32Array(count * 3);
        const color = new Float32Array(count * 3);
        const scale = new Float32Array(count);
        const speed = new Float32Array(count);
        const phase = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const radius = 50;
            const t = Math.random() * Math.PI * 2;
            const p = Math.acos(2 * Math.random() - 1);
            pos[i * 3] = radius * Math.sin(p) * Math.cos(t);
            pos[i * 3 + 1] = radius * Math.sin(p) * Math.sin(t);
            pos[i * 3 + 2] = radius * Math.cos(p);
            if (Math.random() > 0.2) {
                color[i * 3] = 1.0;
                color[i * 3 + 1] = 1.0;
                color[i * 3 + 2] = 1.0;
            }
            else {
                color[i * 3] = 0.7 + Math.random() * 0.3;
                color[i * 3 + 1] = 0.5 + Math.random() * 0.3;
                color[i * 3 + 2] = 0.5 + Math.random() * 0.3;
            }
            scale[i] = 0.1 + Math.random() * 4;
            phase[i] = Math.random() * Math.PI * 2;
        }
        return {
            pos,
            color,
            scale,
            speed,
            phase,
        };
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadShaders();
            return Promise.resolve();
        });
    }
    update(deltaTime) {
        if (!this.mesh || !this.points)
            return;
        const factor = this.timeCycle.getTimeFactor();
        const rotationSpeed = 0.03;
        this.points.rotation.x += rotationSpeed * deltaTime;
        const totalTime = performance.now() * 0.001;
        this.skyboxMaterial.uniforms.timeFactor.value = factor;
        this.starsMaterial.uniforms.timeFactor.value = factor;
        this.starsMaterial.uniforms.time.value = totalTime;
        this.starsMaterial.needsUpdate = true;
    }
    getMesh() {
        return this.mesh;
    }
}
