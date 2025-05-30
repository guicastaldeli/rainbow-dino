import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Time } from '../time';
import { Display } from '../display';
import { CollDetector } from '../coll-detector.js';

export class Terrain {
    private timeCycle: Time;

    private loader!: OBJLoader;
    private texLoader!: THREE.TextureLoader;
    private mesh!: THREE.Object3D;
    private material!: THREE.ShaderMaterial;
    private blockGroup = new THREE.Group();

    private blocks: THREE.Mesh[] = [];
    private speed = 1;
    private length = 15;

    private display: Display;

    size = {
        w: 1,
        h: 1,
        d: 0.1,

        gap: 1.58
    }

    pos = {
        x: -7,
        y: -3,
        z: -3.1
    }

    constructor(timeCycle: Time, display: Display) {
        this.timeCycle = timeCycle;
        this.display = display;

        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
    }

    private async createTerrain(x: number): Promise<THREE.Mesh> {
        try {
            const [vertexShader, fragmentShader] = await Promise.all([
                this.loadShader('./el/shaders/vertexShader.glsl'),
                this.loadShader('./el/shaders/fragShader.glsl')
            ]);

            const path = '../../../assets/obj/terrain-block.obj';
            const texPath = '../../../assets/textures/terrain-block.png';
            const tex = this.texLoader.load(texPath);

            const bounds = this.display.getBounds();

            this.material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    timeFactor: { value: 0.0 },
                    map: { value: tex },
                    bounds: { value: bounds.clone() }
                },
                vertexShader,
                fragmentShader,
                side: THREE.DoubleSide,
                clipping: true
            });

            return new Promise<THREE.Mesh>((res) => {
                this.loader.load(path, async (obj) => {
                    this.mesh = obj;
                    let block: THREE.Mesh | undefined;
                    
                    this.mesh.traverse((m) => {
                        if(m instanceof THREE.Mesh && !block) {
                            this.material.depthWrite = true;
                            this.material.depthTest = true;
                            m.material = this.material;
                            block = m;
                        }
                    });

                    if(!block) throw new Error("err");

                    block.position.x = x * this.size.gap + this.pos.x;
                    block.position.y = this.pos.y;
                    block.position.z = this.pos.z;

                    res(block);
                });
            });
        } catch(err) {
            console.log(err);
            return Promise.reject(err);
        }
    }

    private async setTerrain(): Promise<void> {
        const blockArray: Promise<THREE.Mesh>[] = [];

        for(let i = 0; i < this.length; i++) {
            const x = i * this.size.w;
            blockArray.push(this.createTerrain(x));
        }

        const block = await Promise.all(blockArray);
        this.blocks.push(...block);
        this.blockGroup.add(...block);
    }

    public getTerrainBlocks(): THREE.Mesh[] {
        return this.blocks;
    }

    private resetBlock(block: THREE.Mesh): void {
        let fBlock = this.blocks[0];
        for(const b of this.blocks) if(b.position.x > fBlock.position.x) fBlock = b;
        block.position.x = fBlock.position.x + this.size.gap;
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return await res.text();
    }

    public update(deltaTime: number, collDetector: CollDetector): void {
        if(!this.mesh) return;
        
        for(const b of this.blocks) {
            b.position.x -= this.speed * deltaTime;
            const objBox = new THREE.Box3().setFromObject(b);

            if(collDetector.isObjColliding(objBox)) this.resetBlock(b);
        }

        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001;

        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }

    public async ready(): Promise<THREE.Object3D> {
        await this.setTerrain();
        return this.blockGroup;
    }
}