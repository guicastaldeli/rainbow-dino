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
export class Skybox {
    constructor(timeCycle) {
        this.timeCycle = timeCycle;
        this.uniforms = {
            timeFactor: { value: 0.0 },
            uTime: { value: 0 },
            resolution: {
                value: new THREE.Vector2(window.innerWidth, window.innerHeight)
            }
        };
        this.uniforms.uTime.value = performance.now() / 1000;
        this.loadShaders();
    }
    loadShaders() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [vertexShader, fragShader] = yield Promise.all([
                    this.loadShader('../main/shaders/vertexShader.glsl'),
                    this.loadShader('../main/shaders/fragShader.glsl')
                ]);
                this.material = new THREE.ShaderMaterial({
                    uniforms: this.uniforms,
                    vertexShader: vertexShader,
                    fragmentShader: fragShader,
                    side: THREE.BackSide,
                });
                const geometry = new THREE.BoxGeometry(50, 50, 50);
                this.mesh = new THREE.Mesh(geometry, this.material);
                return this.mesh;
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
            return res.text();
        });
    }
    update(deltaTime) {
        const factor = this.timeCycle.getTimeFactor();
        //console.log(factor)
        this.uniforms.timeFactor.value = factor;
    }
    getMesh() {
        return this.mesh;
    }
}
