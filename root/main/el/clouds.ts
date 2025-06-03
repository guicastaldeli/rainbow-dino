import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Tick } from '../tick';
import { Time } from '../time';
import { Display } from '../display';
import { CollDetector } from '../coll-detector';

export class Clouds {
    private tick: Tick;
    private timeCycle: Time;
    private display: Display;

    private loader: OBJLoader;
    private texLoader: THREE.TextureLoader;
    private mesh!: THREE.Object3D;
    private material!: THREE.ShaderMaterial;
    private cloudGroup = new THREE.Group();

    private clouds: THREE.Mesh[] = [];
    private speed = 1;
    private length = 20;

    size = {
        w: 1,
        h: 1,
        d: 0.01
    }

    pos = {
        x: 0,
        y: 0.8,
        z: -3.3,

        gapX: () => Math.random() * (8 - 4) * 4,
        gapY: () => Math.random() * (0.5 - 0.1) * 0.1
    }

    constructor(tick: Tick, timeCycle: Time, display: Display) {
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.display = display;

        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
    }

    private async createClouds(x: number, y: number): Promise<THREE.Mesh> {
        try {
            const [vertexShader, fragmentShader] = await Promise.all([
                this.loadShader('./el/shaders/vertexShader.glsl'),
                this.loadShader('./el/shaders/fragShader.glsl')
            ]);

            const models = [
                {
                    model: '../../../assets/obj/cloud1.obj',
                    chance: 0.6,
                },
                {
                    model: '../../../assets/obj/cloud2.obj',
                    chance: 0.4
                }
            ];

            const selectedModel = this.randomObjs(models);
            const texPath = '../../../assets/textures/cloud.png';
            const tex = await this.texLoader.loadAsync(texPath);
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
                depthTest: true,
                depthWrite: true,
            });

            return new Promise<THREE.Mesh>((res) => {
                this.loader.load(selectedModel.model, async (obj) => {
                    this.mesh = obj;
                    let objs: THREE.Mesh | undefined;

                    this.mesh.traverse((m) => {
                        if(m instanceof THREE.Mesh && !objs) {
                            m.material = this.material;
                            objs = m;
                        }
                    });

                    if(!objs) return new Error('err');

                    objs.scale.setScalar(0.4);
                    objs.position.x = (x * this.pos.gapX()) + this.pos.x;
                    objs.position.y = (y * this.pos.gapY()) + this.pos.y;
                    objs.position.z = this.pos.z;

                    res(objs);
                });
            })
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    private randomObjs(items: { model: string, chance: number }[]) {
        let totalChance = items.reduce((sum, item) => sum + item.chance, 0);
        let random = Math.random() * totalChance;
        let current = 0;

        for(let item of items) {
            if(random <= item.chance + current) return item;
            current += item.chance;
        }

        return items[0];
    }

    private async setClouds(): Promise<void> {
        const cloudsArray: Promise<THREE.Mesh>[] = [];

        for(let i = 0; i < this.length; i++) {
            const x = i * this.size.w;
            const y = i * this.size.h;
            cloudsArray.push(this.createClouds(x, y)); 
        }

        const obj = await Promise.all(cloudsArray);
        this.clouds.push(...obj);
        this.cloudGroup.add(...obj);
    }

    public getClouds(): THREE.Mesh[] {
        return this.clouds;
    }

    private resetCloud(cloud: THREE.Mesh): void {
        let fCloud = this.clouds[0];

        for(const c of this.clouds) {
            if(c.position.x > fCloud.position.x) {
                fCloud = c;
            }
        }

        cloud.position.x = fCloud.position.x + this.pos.gapX();
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return await res.text();
    }

    public update(deltaTime: number, collDetector: CollDetector): void {
        if(!this.mesh || !this.material) return;

        const scaledDelta = this.tick.getScaledDelta(deltaTime);

        for(const c of this.clouds) {
            c.position.x -= this.speed * scaledDelta;
            const objBox = new THREE.Box3().setFromObject(c);

            if(collDetector.isColliding(objBox)) this.resetCloud(c);
        }

        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001 * this.tick.getTimeScale();

        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }

    public async ready(): Promise<THREE.Object3D> {
        await this.setClouds();
        return this.cloudGroup;
    }
}