import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Tick } from '../tick';
import { Time } from '../time';
import { Lightning } from '../lightning.js';
import { Display } from '../display';
import { CollDetector } from '../coll-detector.js';
import { ObstacleManager } from './obstacle-manager';

export class Crow {
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

    private loader!: OBJLoader;
    private texLoader!: THREE.TextureLoader;
    private mesh!: THREE.Object3D;
    private material!: THREE.ShaderMaterial;
    
    private obs: THREE.Mesh[] = [];
    private obsBox: THREE.Box3[] = []; 
    private obsGroup = new THREE.Group();
    private length = 10;

    private deltaTime!: number;
    private currentModelIndex = 0;
    private lastSwitchTime = 0;
    private switchInterval = 0.5;
    private geometries: THREE.BufferGeometry[] = [];
    private currentTexture: THREE.Texture[] = [];
    private models: {
        geometry: Promise<THREE.BufferGeometry>,
        tex: Promise<THREE.Texture>
    }[] = [];

    size = {
        w: 1,
        h: 1,
        d: 1
    }

    pos = {
        x: 0,
        y: () => Math.random() * (0.5 - (-1)) + (-1),
        z: () => Math.random() * ((-3.4) - (-3.2)) + (-3.2),

        gap: () => Math.random() * (32 - 16) + 16,
        minDistance: 16
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

        //Models
        this.models = [
            {
                geometry: this.loadModel('../../../assets/obj/crow1.obj'),
                tex: this.texLoader.loadAsync('../../../assets/textures/crow1.png')
            },
            {
                geometry: this.loadModel('../../../assets/obj/crow2.obj'),
                tex: this.texLoader.loadAsync('../../../assets/textures/crow2.png')
            }
        ];
    }

    private loadModel(url: string): Promise<THREE.BufferGeometry> {
        return new Promise((res) => {
            this.loader.load(url, (obj) => {
                let geometry: THREE.BufferGeometry | undefined;

                obj.traverse((o) => {
                    if(o instanceof THREE.Mesh && !geometry) {
                        geometry = o.geometry;
                        o.receiveShadow = true;
                        o.castShadow = true;
                    }
                });

                if(!geometry) throw new Error('No geometry found');
                res(geometry);
            })
        })
    }

    private async createCrow(x: number): Promise<THREE.Mesh> {
        try {
            const [vertexShader, fragmentShader, tex, geometry] = await Promise.all([
                this.loadShader('./el/shaders/vertexShader.glsl'),
                this.loadShader('./el/shaders/fragShader.glsl'),
                this.models[this.currentModelIndex].tex,
                this.models[this.currentModelIndex].geometry
            ]);

            const bounds = this.display.getBounds();

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    timeFactor: { value: 0.0 },
                    map: { value: tex },
                    bounds: { value: bounds.clone() },
                    isObs: { value: true },
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
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry.clone(), material);
            const crowMesh = mesh as THREE.Mesh & { type: 'crow' }

            crowMesh.scale.x = this.size.w;
            crowMesh.scale.x = this.size.h;
            crowMesh.scale.x = this.size.d;

            crowMesh.position.x = (x * this.pos.gap()) + this.pos.x;
            crowMesh.position.y = this.pos.y();
            crowMesh.position.z = this.pos.z();

            crowMesh.receiveShadow = true;

            const box = new THREE.Box3().setFromObject(crowMesh);
            this.obsBox.push(box);

            return crowMesh;
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    private animateObs() {
        if(this.tick['paused'] || this.tick['gameover']) return;
        
        const currentTime = performance.now() * this.timeCycle['initSpeed'];

        if(currentTime - this.lastSwitchTime >= this.switchInterval) {
            this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
            this.lastSwitchTime = currentTime;

            Promise.all(this.models.map(m => Promise.all([m.geometry, m.tex])))
                .then(() => {
                    this.obs.forEach(async (crow) => {
                        const model = this.models[this.currentModelIndex];
                        const [geometry, tex] = await Promise.all([
                            model.geometry,
                            model.tex
                        ]);

                        crow.geometry.dispose();
                        crow.geometry = geometry.clone();

                        if(crow.material instanceof THREE.ShaderMaterial) {
                            crow.material.uniforms.map.value = tex;
                            crow.material.needsUpdate = true;
                        }
                    });
                }
            );
        }
    }

    private async setObs(): Promise<void> {
        const obsArray: Promise<THREE.Mesh>[] = [];
        for(let i = 0; i < this.length; i++) obsArray.push(this.createCrow(i));
        
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

        let newX = fObs.position.x + this.pos.gap();
        let attempts = 0;
        let maxAttempts = 10;

        while(attempts < maxAttempts) {
            const tempBox = new THREE.Box3().setFromObject(obs);
            tempBox.translate(new THREE.Vector3(newX - obs.position.x, 0, 0));
            let overlaps = false;

            for(const box of this.obsBox) {
                if(tempBox.intersectsBox(box)) {
                    overlaps = true;
                    break;
                }
            }

            if(!overlaps) break;

            newX += this.pos.minDistance;
            attempts++;
        }

        obs.position.x = newX;
        this.obsBox[this.obs.indexOf(obs)] = new THREE.Box3().setFromObject(obs);
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return await res.text();
    }

    public update(deltaTime: number, collDetector: CollDetector): void {
        if(this.obs.length === 0) return;

        this.deltaTime = deltaTime;
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * this.timeCycle['initSpeed'] * this.tick.getTimeScale();
        const speed = this.timeCycle['scrollSpeed'] * 1.5;
        const ambientColor = this.lightning.update(factor);

        this.animateObs();

        this.obs.forEach((o, i) => {
            o.position.x -= speed * scaledDelta;
            const objBox = new THREE.Box3().setFromObject(o);

            if(o.material instanceof THREE.ShaderMaterial) {
                o.material.uniforms.time.value = totalTime;
                o.material.uniforms.timeFactor.value = factor;

                o.material.uniforms.ambientLightColor.value = ambientColor;
                o.material.uniforms.ambientLightIntensity.value = this.ambientLightIntensity;

                o.material.uniforms.directionalLightColor.value = this.directionalLightColor;
                o.material.uniforms.directionalLightIntensity.value = this.directionalLightIntensity;
                o.material.uniforms.directionalLightPosition.value = this.directionalLightPosition;
                o.material.uniforms.directionalLightMatrix.value = this.directionalLight.shadow.matrix;

                o.material.needsUpdate = true;
            }

            if(collDetector.isColliding(objBox)) {
                this.resetObs(o);
                this.obsBox[i] = new THREE.Box3().setFromObject(o);
            }
        })
    }

    public async ready(): Promise<THREE.Object3D> {
        await this.setObs();
        return this.obsGroup;
    }
}