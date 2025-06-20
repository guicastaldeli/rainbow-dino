import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Tick } from '../tick';
import { Time } from '../time';
import { Lightning } from '../lightning.js';
import { Display } from '../display';
import { CollDetector } from '../coll-detector.js';

export class Terrain {
    private tick: Tick;
    private timeCycle: Time;
    private display: Display;

    private lightning: Lightning;
    private ambientLightColor: THREE.Color;
    private ambientLightIntensity: number;
    private directionalLight: THREE.DirectionalLight;
    private directionalLightColor: THREE.Color;
    private directionalLightIntensity: number;
    private directionalLightPosition: THREE.Vector3;

    private loader: OBJLoader;
    private texLoader: THREE.TextureLoader;
    private mesh!: THREE.Object3D;
    private material!: THREE.ShaderMaterial;
    
    private blocks: THREE.Mesh[] = [];
    private blockGroup = new THREE.Group();
    private initialPos: THREE.Vector3[] = [];
    private length = 15;

    size = {
        w: 1,
        h: 1,
        d: 1.6,
    }
    
    pos = {
        x: -10,
        y: -3,
        z: -3.1,

        gap: () => 1.6
    }

    constructor(tick: Tick, timeCycle: Time, display: Display) {
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.display = display;

        //Lightning
            this.lightning = new Lightning(this.tick, this.timeCycle);

            this.ambientLightColor = this.lightning.getColor();
            this.ambientLightIntensity = this.lightning.getAmbientLightIntensity();

            this.directionalLight = this.lightning.getDirectionalLight();
            this.directionalLightColor = this.lightning.getDirectionalLightColor();
            this.directionalLightIntensity = this.lightning.getDirectionalLightIntensity();
            this.directionalLightPosition = this.lightning.getDirectionalLightPos();
        //

        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
    }

    private async initMaterial(): Promise<void> {
        try {
            const [vertexShader, fragmentShader] = await Promise.all([
                this.loadShader('./el/shaders/vertexShader.glsl'),
                this.loadShader('./el/shaders/fragShader.glsl')
            ]);
    
            const texPath = '../../../assets/textures/terrain-block.png';
            const tex = await this.texLoader.loadAsync(texPath);
    
            const bounds = this.display.getBounds();
    
            this.material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    timeFactor: { value: 0.0 },
                    map: { value: tex },
                    bounds: { value: bounds.clone() },
                    isObs: { value: false },
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
                side: THREE.DoubleSide,
            });
        } catch(err) {
            console.log(err);
        }
    }

    private async createTerrain(x: number): Promise<THREE.Mesh> {
        const path = '../../../assets/obj/terrain-block.obj';

        return new Promise<THREE.Mesh>((res, rej) => {
            this.loader.load(path, async (obj) => {
                this.mesh = obj;
                let block: THREE.Mesh | undefined;
                    
                this.mesh.traverse((m) => {
                    if(m instanceof THREE.Mesh && !block) {
                        m.material = this.material;
                        m.castShadow = true;
                        m.receiveShadow = true;
                        block = m;
                    }
                });

                if(!block) throw new Error("err");

                block.scale.x = this.size.w;
                block.scale.y = this.size.h;
                block.scale.z = this.size.d;

                block.position.x = this.pos.x + (x * this.size.w * this.pos.gap());
                block.position.y = this.pos.y;
                block.position.z = this.pos.z;

                res(block);
            }, undefined, rej);
        });
    }

    private async setTerrain(): Promise<void> {
        const bArray: Promise<THREE.Mesh>[] = [];
        for(let i = 0; i < this.length; i++) bArray.push(this.createTerrain(i));
        
        const b = await Promise.all(bArray);
        this.blocks.push(...b);
        this.blockGroup.add(...b);
    }

    public getTerrainBlocks(): THREE.Mesh[] {
        return this.blocks;
    }
    
    private movBlocks(b: THREE.Mesh, speed: number, scaledDelta: number): void {
        b.position.x -= speed * scaledDelta;
    }

    private resetBlocks(b: THREE.Mesh, speed: number, scaledDelta: number): void {
        let fx = this.blocks[0];

        this.blocks.forEach(block => {
            const x = block.position.x - (speed * scaledDelta);
            if(x > fx.position.x) fx = block;
        });

        const updX = fx.position.x + (this.size.w * this.pos.gap()) - (speed * scaledDelta);
        b.position.x = updX;
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return await res.text();
    }

    public resetState(): void {
        this.blocks.forEach((b, i) => {
            b.position.x = this.pos.x + (i * this.size.w * this.pos.gap());
            b.position.y = this.pos.y;
            b.position.z = this.pos.z;
        });

        this.blockGroup.position.set(0, 0, 0);

        if(this.material) {
            this.material.uniforms.time.value = 0.0;
            this.material.uniforms.timeFactor.value = 0.0;
            this.material.needsUpdate = true;
        }
    }

    public update(deltaTime: number, collDetector: CollDetector): void {
        if(!this.mesh || !this.material || this.blocks.length !== this.length) return;

        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        const speed = this.timeCycle['scrollSpeed'];
        
        for(let i = 0; i < this.blocks.length; i++) {
            const b = this.blocks[i];
            const box = new THREE.Box3().setFromObject(b);
            this.movBlocks(b, speed, scaledDelta);

            if(collDetector.isColliding(box)) this.resetBlocks(b, speed, scaledDelta);
        }

        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * this.timeCycle['initSpeed'] * this.tick.getTimeScale();
        const ambientColor = this.lightning.update(factor);

        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;

        this.material.uniforms.ambientLightColor.value = ambientColor;
        this.material.uniforms.ambientLightIntensity.value = this.ambientLightIntensity;

        this.material.uniforms.directionalLightColor.value = this.directionalLightColor;
        this.material.uniforms.directionalLightIntensity.value = this.directionalLightIntensity;
        this.material.uniforms.directionalLightPosition.value = this.directionalLightPosition;
        this.material.uniforms.directionalLightMatrix.value = this.directionalLight.shadow.matrix;

        this.material.needsUpdate = true;
    }

    public async ready(): Promise<THREE.Object3D> {
        try {
            await this.initMaterial();
            await this.setTerrain();
            return this.blockGroup;
        } catch(err) {
            console.log(err);
            throw err;
        }
    }
}