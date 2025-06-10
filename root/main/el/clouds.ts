import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Tick } from '../tick';
import { Time } from '../time';
import { Lightning } from '../lightning.js';
import { Display } from '../display';
import { CollDetector } from '../coll-detector';

export class Clouds {
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
    private cloudGroup = new THREE.Group();

    private clouds: THREE.Mesh[] = [];
    private length = 30;

    size = {
        w: 0.5,
        h: 0.5,
        d: 0.5
    }

    pos = {
        x: -4,
        y: 0,
        z: () => Math.random() * ((-3.45) - (-3.1)) + (-3.1),

        gapX: () => Math.random() * (20 - 2) + 2,
        gapY: () => Math.random() * (0.5 - (-0.5)) + (-0.5)
    }

    constructor(tick: Tick, timeCycle: Time, display: Display) {
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.display = display;

        //Lightning
            this.lightning = new Lightning(this.tick, this.timeCycle);

            this.ambientLightColor = this.lightning.getColor();
            this.ambientLightIntensity = this.lightning['intensity'];

            this.directionalLight = this.lightning['directionalLight'];
            this.directionalLightColor = this.lightning['dlColor'];
            this.directionalLightIntensity = this.lightning['dlIntensity'];
            this.directionalLightPosition = this.lightning['dlPosition'];
        //

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
                    bounds: { value: bounds.clone() },
                    isObs: { value: false },
                    isCloud: { value: true },
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
                transparent: true,
            });

            return new Promise<THREE.Mesh>((res) => {
                this.loader.load(selectedModel.model, async (obj) => {
                    this.mesh = obj;
                    let clouds: THREE.Mesh | undefined;

                    this.mesh.traverse((m) => {
                        if(m instanceof THREE.Mesh && !clouds) {
                            m.material = this.material;
                            m.receiveShadow = true;
                            m.castShadow = true;
                            clouds = m;
                        }
                    });

                    if(!clouds) return new Error('err');

                    clouds.scale.x = this.size.w;
                    clouds.scale.y = this.size.h;
                    clouds.scale.z = this.size.d;

                    clouds.position.x = (x * this.pos.gapX()) + this.pos.x;
                    clouds.position.y = (y * this.pos.gapY()) + this.pos.y;
                    clouds.position.z = this.pos.z();

                    res(clouds);
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

    public resetState(): void {
        this.clouds.forEach((c, i) => {
            const x = i * this.size.w;
            const y = i * this.size.h;

            c.position.x = (x * this.pos.gapX()) + this.pos.x;
            c.position.y = (y * this.pos.gapY()) + this.pos.y;
            c.position.z = this.pos.z();
        });

        if(this.material) {
            this.material.uniforms.time.value = 0.0;
            this.material.uniforms.timeFactor.value = 0.0;
            this.material.needsUpdate = true;
        }

        this.cloudGroup.position.set(0, 0, 0);
    }

    public update(deltaTime: number, collDetector: CollDetector): void {
        if(!this.mesh || !this.material) return;

        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        const speed = this.timeCycle['scrollSpeed'] / 2;

        for(const c of this.clouds) {
            c.position.x -= speed * scaledDelta;
            const objBox = new THREE.Box3().setFromObject(c);

            if(collDetector.isColliding(objBox)) this.resetCloud(c);
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
        await this.setClouds();
        return this.cloudGroup;
    }
}