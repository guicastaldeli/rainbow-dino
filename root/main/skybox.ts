import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import { Time } from './time';

export class Skybox {
    private material?: THREE.ShaderMaterial | THREE.PointsMaterial;
    private timeCycle: Time;
    private mesh!: THREE.Mesh;

    public points!: THREE.Points;
    private geometries: THREE.BufferGeometry[] = [];

    constructor(timeCycle: Time, count: number = 300) {
        this.timeCycle = timeCycle;
        this.generateStars(count);
    }

    public async loadShaders() {
        try {
            const [vertexShader, fragmentShader] = await Promise.all([
                this.loadShader('../main/shaders/vertexShader.glsl'),
                this.loadShader('../main/shaders/fragShader.glsl')
            ]);

            this.material = new THREE.ShaderMaterial({
                uniforms: {
                    timeFactor: { value: 0.0 },
                    time: { value: 0 },
                    size: { value: 1.0 },
                    resolution: { 
                        value: new THREE.Vector2(window.innerWidth, window.innerHeight) 
                    }
                },
                vertexShader,
                fragmentShader,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });

            const geometry = new THREE.BoxGeometry(50, 50, 50);
            this.mesh = new THREE.Mesh(geometry, this.material);

            const mergedGeometry = mergeGeometries(this.geometries);
            this.geometries.forEach(g => g.dispose());
            this.geometries = [];
            this.points = new THREE.Points(mergedGeometry, this.material);

            return this.mesh;
        } catch(error) {
            console.error(error);
            throw error;
        }
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return await res.text();
    }

    //Stars
    private generateStars(count: number, chunks: number = 1): void {
        const starChunk = Math.ceil(count / chunks);
        this.geometries = [];

        for(let i = 0; i < chunks; i++) {
            const geometry = new THREE.BufferGeometry();
            const chunkCount = i === chunks - 1 ? - (i * starChunk) : starChunk;

            const { pos, color, scale, phase } = this.createStars(chunkCount);
            geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(color, 3));
            geometry.setAttribute('scale', new THREE.BufferAttribute(scale, 1));
            geometry.setAttribute('phase', new THREE.BufferAttribute(phase, 1));

            this.geometries.push(geometry);
        }
    }

    private createStars(count: number) {
        const pos = new Float32Array(count * 3);
        const color = new Float32Array(count * 3);
        const scale = new Float32Array(count);
        const speed = new Float32Array(count);
        const phase = new Float32Array(count);

        for(let i = 0; i < count; i++) {
            const radius = 50;
            const t = Math.random() * Math.PI * 2;
            const p = Math.acos(2 * Math.random() - 1);

            pos[i * 3] = radius * Math.sin(p) * Math.cos(t);
            pos[i * 3 + 1] = radius * Math.sin(p) * Math.sin(t);
            pos[i * 3 + 2] = radius * Math.cos(p);

            if(Math.random() > 0.2) {
                color[i * 3] = 1.0;
                color[i * 3 + 1] = 1.0;
                color[i * 3 + 2] = 1.0
            } else {
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
            phase
        }
    }

    public async ready(): Promise<void> {
        await this.loadShaders();
        return Promise.resolve();
    }

    public update(deltaTime: number) {
        if(!this.points || !this.material) return;
        const factor = this.timeCycle.getTimeFactor();
        //console.log(factor)

        const rotationSpeed = 0.5;
        this.points.rotation.y += rotationSpeed * deltaTime;

        const uniforms = (this.material as THREE.ShaderMaterial).uniforms;
        uniforms.timeFactor.value = factor;
        uniforms.time.value = this.timeCycle.getTotalTime();
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }
}