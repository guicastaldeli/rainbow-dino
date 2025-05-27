import * as THREE from 'three';
import { Time } from './time';

export class Skybox {
    private material: THREE.ShaderMaterial;
    private timeCycle: Time;
    private uniforms: any;
    private mesh: THREE.Mesh;

    constructor(timeCycle: Time) {
        this.timeCycle = timeCycle;

        this.uniforms = {
            timeFactor: { value: 0.0 },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerWidth) }
        }

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            side: THREE.BackSide
        });

        const geometry = new THREE.BoxGeometry(500, 500, 500);
        this.mesh = new THREE.Mesh(geometry, this.material);
    }

    public async loadShaders() {
        try {
            const [vertexShader, fragShader] = await Promise.all([
                this.loadShader('./shaders/vertexShader.glsl'),
                this.loadShader('./shaders/fragShader.glsl')
            ]);

            this.material.vertexShader = vertexShader;
            this.material.fragmentShader = fragShader;
            this.material.needsUpdate = true;

            return this.mesh;
        } catch(error) {
            console.error(error);
        }
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return res.text();
    }

    public update(deltaTime: number) {
        this.uniforms.timeFactor.value = this.timeCycle.getTimeFactor();
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }
}