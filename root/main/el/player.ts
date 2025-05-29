import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Time } from '../time';

export class Player {
    private timeCycle: Time;

    private loader!: OBJLoader;
    private texLoader!: THREE.TextureLoader;
    private mesh!: THREE.Object3D;
    private material!: THREE.ShaderMaterial;

    pos = {
        x: 3,
        y: 0,
        z: -3
    }

    constructor(timeCycle: Time) {
        this.timeCycle = timeCycle;

        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();

        this.loadPlayer();
    }
    
    private async loadPlayer() {
        try {
            const [vertexShader, fragmentShader] = await Promise.all([
                this.loadShader('./el/shaders/vertexShader.glsl'),
                this.loadShader('./el/shaders/fragShader.glsl')
            ]);

            const path = '../../../assets/obj/cube-test.obj';
            const texPath = '../../../assets/textures/cube-test.png';
            const tex = this.texLoader.load(texPath);
            
            this.material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    timeFactor: { value: 0.0 },
                    map: { value: tex }
                },
                vertexShader,
                fragmentShader,
                side: THREE.DoubleSide,
            });
    
            this.loader.load(path, (obj) => {
                this.mesh = obj;
    
                this.mesh.traverse((m) => {
                    if(m instanceof THREE.Mesh) m.material = this.material;
                });
    
                this.mesh.scale.z = 0.1
                //this.mesh.receiveShadow = true;
                this.mesh.position.x = this.pos.x;
                this.mesh.position.y = this.pos.y;
                this.mesh.position.z = this.pos.z;
            });
        } catch(err) {
            console.log(err);
        }
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return await res.text();
    }

    public update(deltaTime: number) {        
        if(!this.material) return;

        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001;

        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }

    public ready(): Promise<THREE.Object3D> {
        return new Promise(res => {
            if(!this.mesh) {
                const _check = () => this.mesh ? res(this.mesh) : setTimeout(_check, 0);
                _check();
            }
        });
    }
}