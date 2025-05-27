import * as THREE from 'three';
import { Time } from './time';

export class Skybox {
    private material?: THREE.ShaderMaterial;
    private timeCycle: Time;
    private uniforms: any;
    private mesh!: THREE.Mesh;

    constructor(timeCycle: Time) {
        this.timeCycle = timeCycle;

        this.uniforms = {
            timeFactor: { value: 0.0 },
            uTime: { value: 0 },
            resolution: { 
                value: new THREE.Vector2(window.innerWidth, window.innerHeight) 
            }
        }

        this.uniforms.uTime.value = performance.now() / 1000;

        this.loadShaders();
    }

    public async loadShaders() {
        try {
            const [vertexShader, fragShader] = await Promise.all([
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
        } catch(error) {
            console.error(error);
            throw error;
        }
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return res.text();
    }

    public update(deltaTime: number) {
        const factor = this.timeCycle.getTimeFactor();
        //console.log(factor)
        this.uniforms.timeFactor.value = factor;
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }
}