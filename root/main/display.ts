import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Tick } from './tick.js';
import { Time } from './time.js';
import { CollDetector } from './coll-detector.js';
import { Terrain } from './el/terrain.js';
import { Clouds } from './el/clouds.js';
import { Obstacle, ObstacleManager } from './el/obstacle-manager.js';
import { Cactus } from './el/cactus.js';
import { Crow } from './el/crow.js';
import { Player } from './el/player.js';

export class Display {
    private tick: Tick;
    private timeCycle: Time;

    public display: THREE.Group;
    private renderer: THREE.WebGLRenderer;

    private collDetector: CollDetector;

    private mesh!: THREE.Object3D;
    private loader!: OBJLoader;
    private texLoader!: THREE.TextureLoader;
    private material!: THREE.ShaderMaterial;

    //Elements
    private scene?: THREE.Scene;

    private renderClouds!: Clouds;
    private renderTerrain!: Terrain;

    private obstacleManager = new ObstacleManager();
    private renderCactus!: Cactus;
    private renderCrow!: Crow;

    private renderPlayer!: Player;

    constructor(tick: Tick, timeCycle: Time, renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.renderer = renderer;
        this.collDetector = new CollDetector(scene);

        this.display = new THREE.Group;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();

        this.scene = scene;

        this.createDisplay();
    }

    size = {
        w: 0.52,
        h: 0.51,
        d: 2
    }

    pos = {
        x: 0,
        y: -3.75,
        z: -3
    }

    private async createDisplay() {
        try {
            const [vertexShader, fragmentShader] = await Promise.all([
                this.loadShader('../main/shaders/displayVertexShader.glsl'),
                this.loadShader('../main/shaders/displayFragShader.glsl'),
            ]);

            const path = '../../assets/obj/display.obj';
            const texPath = '../../assets/textures/display.png';
            const tex = this.texLoader.load(texPath);

            this.material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    timeFactor: { value: 0.0 },
                    map: { value: tex },
                    bounds: { value: new THREE.Vector4() }
                },
                vertexShader,
                fragmentShader,
                side: THREE.DoubleSide,
                clipping: true
            });

            await new Promise<void>((res) => {
                this.loader.load(path, (obj) => {
                    this.mesh = obj;
    
                    this.mesh.traverse((m) => {
                        if(m instanceof THREE.Mesh) m.material = this.material;
                    });

                    this.mesh.scale.x = this.size.w;
                    this.mesh.scale.y = this.size.h;
                    this.mesh.scale.z = this.size.d;
    
                    this.mesh.position.x = this.pos.x,
                    this.mesh.position.y = this.pos.y,
                    this.mesh.position.z = this.pos.z;

                    if(this.display) {
                        const bounds = this.getBounds();
                        this.material.uniforms.bounds.value.copy(bounds)
                    }
                    res();
                });
            })
        } catch(err) {
            console.log(err);
        }
    }

    public getBounds(): THREE.Vector4 {
        const displayBox = new THREE.Box3().setFromObject(this.mesh);
        this.collDetector.setZone(displayBox);
        this.collDetector.outDisplayBounds(displayBox);

        const min = displayBox.min;
        const max = displayBox.max;
        const bounds = new THREE.Vector4(
            min.x,
            max.x,
            min.y,
            max.y
        );

        this.material.uniforms.bounds.value = bounds;
        return bounds;
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return await res.text();
    }

    private async _mainGroup(): Promise<THREE.Group> {
        this.display = new THREE.Group();

        if(!this.mesh) {
            await new Promise(res => {
                const __check = () => this.mesh ? res(true) : setTimeout(__check, 0); 
                __check();
            });
        }
        
        //Render
            //Display
            this.display.add(this.mesh);

            //Clouds
            this.renderClouds = new Clouds(this.tick, this.timeCycle, this);
            await this.renderClouds.ready();
            const clouds = this.renderClouds.getClouds();

            clouds.forEach(c => {
                this.display.add(c);
            });

            //Terrain
            this.renderTerrain = new Terrain(this.tick, this.timeCycle, this);
            await this.renderTerrain.ready();
            const terrainBlocks = this.renderTerrain.getTerrainBlocks();

            terrainBlocks.forEach(block => {
                this.display.add(block);
            });

            //Obstacles
                //Cactus
                    this.renderCactus = new Cactus(this.tick, this.timeCycle, this);
                    await this.renderCactus.ready();
                    const cactus = this.renderCactus.getObs();
                    
                    cactus.forEach(c => {
                        this.display.add(c);
                    });
                    
                    this.obstacleManager.addObstacle(cactus as Obstacle[]);
                //

                //Crow
                    this.renderCrow = new Crow(this.tick, this.timeCycle, this);
                    await this.renderCrow.ready();
                    const crow = this.renderCrow.getObs();

                    crow.forEach(c => {
                        this.display.add(c);
                    });

                    this.obstacleManager.addObstacle(crow as Obstacle[]);
                //
            //

            //Player
            this.renderPlayer = new Player(this.tick, this.timeCycle, this.collDetector, this.obstacleManager.getObstacles());
            const playerObj = await this.renderPlayer.ready();
            this.display.add(playerObj);
        //

        return this.display;
    }

    public update(deltaTime: number) {
        if(!this.material || !this.mesh) return;

        if(this.renderClouds) this.renderClouds.update(deltaTime, this.collDetector);
        if(this.renderTerrain) this.renderTerrain.update(deltaTime, this.collDetector);
        if(this.renderCactus) this.renderCactus.update(deltaTime, this.collDetector);
        if(this.renderCrow) this.renderCrow.update(deltaTime, this.collDetector);
        if(this.renderPlayer) this.renderPlayer.update(deltaTime);

        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001;

        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }

    public async ready(): Promise<THREE.Group> {
        return await this._mainGroup();
    }

    //Resize
        private handleResize(): void {
            this.size.w = this.size.w;
            this.size.h = this.size.h;

            window.addEventListener('resize', () => {
                this.handleResize();
            });
        }
    //
}