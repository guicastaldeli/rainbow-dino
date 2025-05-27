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
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerWidth) }
        };
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            side: THREE.BackSide
        });
        const geometry = new THREE.BoxGeometry(500, 500, 500);
        this.mesh = new THREE.Mesh(geometry, this.material);
    }
    loadShaders() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [vertexShader, fragShader] = yield Promise.all([
                    this.loadShader('./shaders/vertexShader.glsl'),
                    this.loadShader('./shaders/fragShader.glsl')
                ]);
                this.material.vertexShader = vertexShader;
                this.material.fragmentShader = fragShader;
                this.material.needsUpdate = true;
                return this.mesh;
            }
            catch (error) {
                console.error(error);
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
        this.uniforms.timeFactor.value = this.timeCycle.getTimeFactor();
    }
    getMesh() {
        return this.mesh;
    }
}
