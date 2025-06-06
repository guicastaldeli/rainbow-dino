import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Tick } from '../tick';
import { Time } from '../time';
import { Display } from '../display';
import { CollDetector } from '../coll-detector.js';
import { ObstacleManager } from './obstacle-manager';

export class Cactus {
    private tick: Tick;
    private timeCycle: Time;
    private display: Display;

    private loader!: OBJLoader;
    private texLoader!: THREE.TextureLoader;
    private mesh!: THREE.Object3D
    private material!: THREE.ShaderMaterial;
    
    private obs: THREE.Mesh[] = [];
    private obsBox: THREE.Box3[] = [];
    private obsGroup = new THREE.Group();

    private length = 20;

    size = {
        w: 1,
        h: 1,
        d: 1,
    }
    
    pos = {
        x: 8,
        y: -3,
        z: -3.1,

        gap: () => Math.random() * (32 - 16) + 16
    }

    constructor(tick: Tick, timeCycle: Time, display: Display) {
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.display = display;

        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
    }

    private async createCactus(x: number): Promise<THREE.Mesh> {
        try {
            const [vertexShader, fragmentShader] = await Promise.all([
                this.loadShader('./el/shaders/vertexShader.glsl'),
                this.loadShader('./el/shaders/fragShader.glsl')
            ]);

            const models = [
                {
                    model: '../../../assets/obj/cactus1.obj',
                    tex: '../../../assets/textures/cactus1.png',
                    chance: 0.5
                },
                {
                    model: '../../../assets/obj/cactus2.obj',
                    tex: '../../../assets/textures/cactus2.png',
                    chance: 0.5
                }
            ];

            const selectedModel = this.randomObjs(models);
            const tex = await this.texLoader.loadAsync(selectedModel.tex);
            const bounds = this.display.getBounds();

            this.material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    timeFactor: { value: 0.0 },
                    map: { value: tex },
                    bounds: { value: bounds.clone() },
                    isObs: { value: true },
                    isCloud: { value: false }
                },
                vertexShader,
                fragmentShader,
                side: THREE.DoubleSide
            });

            return new Promise<THREE.Mesh>((res) => {
                this.loader.load(selectedModel.model, async (obj) => {
                    this.mesh = obj;
                    let obs: THREE.Mesh | undefined;

                    this.mesh.traverse((m) => {
                        if(m instanceof THREE.Mesh && !obs) {
                            m.material = this.material;
                            obs = m;
                        }
                    });

                    if(!obs) throw new Error('err');

                    const cactusMesh = obs as THREE.Mesh & { type: 'cactus' }

                    cactusMesh.scale.x = this.size.w;
                    cactusMesh.scale.y = this.size.h;
                    cactusMesh.scale.z = this.size.d;

                    cactusMesh.position.x = (x * this.pos.gap()) + this.pos.x;
                    cactusMesh.position.y = this.pos.y;
                    cactusMesh.position.z = this.pos.z;

                    const box = new THREE.Box3().setFromObject(cactusMesh);
                    this.obsBox.push(box);

                    res(obs);
                });
            });
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    private randomObjs(items: { model: string, tex: string, chance: number }[]) {
        let totalChance = items.reduce((sum, item) => sum + item.chance, 0);
        let random = Math.random() * totalChance;
        let current = 0;

        for(let item of items) {
            if(random <= item.chance + current) return item;
            current += item.chance;
        }

        return items[0];
    }

    private async setObs(): Promise<void> {
        const obsArray: Promise<THREE.Mesh>[] = [];
        for(let i = 0; i < this.length; i++) obsArray.push(this.createCactus(i));

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
        
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        const speed = this.timeCycle['scrollSpeed'];

        for(let i = 0; i < this.obs.length; i++) {
            const o = this.obs[i];
            o.position.x -= speed * scaledDelta;
            const objBox = new THREE.Box3().setFromObject(o);

            if(collDetector.isColliding(objBox)) {
                this.resetObs(o);

                const updObjBox = new THREE.Box3().setFromObject(o);
                this.obsBox[i] = updObjBox;
            }
        }

        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * this.timeCycle['initSpeed'] * this.tick.getTimeScale();

        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }

    public async ready(): Promise<THREE.Object3D> {
        await this.setObs();
        return this.obsGroup;
    }
}
