import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Time } from '../time';
import { Display } from '../display';
import { CollDetector } from '../coll-detector.js';

export class Obstacles {
    private timeCycle: Time;

    private loader!: OBJLoader;
    private texLoader!: THREE.TextureLoader;
    private mesh!: THREE.Object3D
    private material!: THREE.ShaderMaterial;
    private obsGroup = new THREE.Group();

    private obs: THREE.Mesh[] = [];
    private speed = 1;
    private length = 20;

    private display: Display;

    size = {
        w: 1,
        h: 1,
        d: 0.1,

        gap: () => Math.random() * (32 - 16) + 16
    }

    pos = {
        x: 3,
        y: -3,
        z: -3.1
    }

    constructor(timeCycle: Time, display: Display) {
        this.timeCycle = timeCycle;
        this.display = display;

        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
    }

    private async createObstacles(x: number): Promise<THREE.Mesh> {
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
                    isObs: { value: true }
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

                    obs.position.x = x * this.size.gap() + this.pos.x;
                    obs.position.y = this.pos.y;
                    obs.position.z = this.pos.z;

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

    private async setObstacles(): Promise<void> {
        const obsArray: Promise<THREE.Mesh>[] = [];

        for(let i = 0; i < this.length; i++) {
            const x = i * this.size.w;
            obsArray.push(this.createObstacles(x));
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
        for(const o of this.obs) if(o.position.x > fObs.position.x) fObs = o;
        obs.position.x = fObs.position.x = this.size.gap();
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return await res.text();
    }

    public update(deltaTime: number, collDetector: CollDetector): void {
        if(!this.mesh || !this.material) return;

        for(const o of this.obs) {
            o.position.x -= this.speed * deltaTime;
            const objBox = new THREE.Box3().setFromObject(o);

            if(collDetector.isObjColliding(objBox)) this.resetObs(o);
        }

        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001;

        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }

    public async ready(): Promise<THREE.Object3D> {
        await this.setObstacles();
        return this.obsGroup;
    }
}
