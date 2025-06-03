import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Tick } from '../tick';
import { Time } from '../time';
import { Display } from '../display';
import { CollDetector } from '../coll-detector.js';
import { ObstacleManager } from './obstacle-manager';

export class Crow {
    private tick: Tick;
    private timeCycle: Time;
    private display: Display;

    private loader!: OBJLoader;
    private texLoader!: THREE.TextureLoader;
    private mesh!: THREE.Object3D;
    private material!: THREE.ShaderMaterial;
    
    private obs: THREE.Mesh[] = [];
    private obsBox: THREE.Box3[] = []; 
    private obsGroup = new THREE.Group();

    private deltaTime!: number;
    private currentModelIndex = 0;
    private lastSwitchTime = 0;
    private switchInterval = 0.1;
    private currentTexture: THREE.Texture[] = [];
    private models: { model: string, tex: string }[] = 
    [
        {
            model: '../../../assets/obj/crow1.obj',
            tex: '../../../assets/textures/crow1.png'
        },
        {
            model: '../../../assets/obj/crow2.obj',
            tex: '../../../assets/textures/crow2.png'
        }
    ];
    
    private speed = 5;
    private length = 10;

    size = {
        w: 1,
        h: 1,
        d: 0.1
    }

    pos = {
        x: 9,
        y: () => Math.random() * (-2.5 - -3) * -3,
        z: -3.1,

        gap: () => Math.random() * (64 - 32) * 32
    }

    constructor(tick: Tick, timeCycle: Time, display: Display) {
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.display = display;

        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
    }

    private async createCrow(x: number): Promise<THREE.Mesh> {
        try {
            const [vertexShader, fragmentShader] = await Promise.all([
                this.loadShader('./el/shaders/vertexShader.glsl'),
                this.loadShader('./el/shaders/fragShader.glsl')
            ]);

            if(this.currentTexture.length === 0) {
                this.currentTexture = await Promise.all(
                    this.models.map(model =>
                        this.texLoader.loadAsync(model.tex)
                    )
                );
            }

            const bounds = this.display.getBounds();

            this.material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    timeFactor: { value: 0.0 },
                    map: { value: this.currentTexture[this.currentModelIndex] },
                    bounds: { value: bounds.clone() },
                    isObs: { value: true }
                },
                vertexShader,
                fragmentShader,
                side: THREE.DoubleSide
            });

            const initialModel = this.models[this.currentModelIndex];

            return new Promise<THREE.Mesh>((res) => {
                this.loader.load(initialModel.model, async (obj) => {
                    this.mesh = obj;
                    let obs: THREE.Mesh | undefined;

                    this.mesh.traverse((m) => {
                        if(m instanceof THREE.Mesh && !obs) {
                            m.material = this.material;
                            obs = m;
                        }
                    });

                    if(!obs) throw new Error('err');

                    const crowMesh = obs as THREE.Mesh & { type: 'crow' }
                    crowMesh.position.x = (x * this.pos.gap()) + this.pos.x;
                    crowMesh.position.y = this.pos.y();
                    crowMesh.position.z = this.pos.z;

                    const box = new THREE.Box3().setFromObject(crowMesh);
                    this.obsBox.push(box);

                    res(obs);
                })
            });
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    private animateObs(items: { model: string, tex: string }[]) {
        const scaledDelta = this.tick.getScaledDelta(this.deltaTime);
        const currentTime = performance.now() * 0.001 * scaledDelta;

        if(currentTime - this.lastSwitchTime >= this.switchInterval) {
            this.currentModelIndex = (this.currentModelIndex + 1) % items.length;
            this.lastSwitchTime = currentTime;

            this.material.uniforms.map.value = this.currentTexture[this.currentModelIndex];
            this.material.needsUpdate = true;
        }

        return items[this.currentModelIndex];
    }

    private async setObs(): Promise<void> {
        const obsArray: Promise<THREE.Mesh>[] = [];

        for(let i = 0; i < this.length; i++) {
            const x = i * this.size.w;
            obsArray.push(this.createCrow(x));
        }

        const obs = await Promise.all(obsArray);
        this.obs.push(...obs);
        this.obsGroup.add(...obs);
    }

    public getObs(): THREE.Mesh[] {
        return this.obs;
    }

    private resetObs(obs: THREE.Mesh): void {
        let fObs = this.obs[0];

        for(const o of this.obs) {
            if(o.position.x > fObs.position.x) {
                fObs = o;
            }
        }

        obs.position.x = fObs.position.x + this.pos.gap();
        this.obsBox[this.obs.indexOf(obs)] = new THREE.Box3().setFromObject(obs);
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return await res.text();
    }

    public update(deltaTime: number, collDetector: CollDetector): void {
        if(!this.mesh || !this.material) return;

        this.deltaTime = deltaTime;
        const scaledDelta = this.tick.getScaledDelta(deltaTime);

        this.animateObs(this.models);

        for(let i = 0; i < this.obs.length; i++) {
            const o = this.obs[i];
            o.position.x -= this.speed * scaledDelta;
            const objBox = new THREE.Box3().setFromObject(o);

            if(collDetector.isColliding(objBox)) {
                this.resetObs(o);

                const updObjBox = new THREE.Box3().setFromObject(o);
                this.obsBox[i] = updObjBox;
            }
        }

        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001 * this.tick.getTimeScale();

        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }

    public async ready(): Promise<THREE.Object3D> {
        await this.setObs();
        return this.obsGroup;
    }
}