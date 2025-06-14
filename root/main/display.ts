import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { GameState } from './game-state.js';
import { Tick } from './tick.js';
import { Time } from './time.js';
import { AudioManager } from './audio-manager.js';
import { Lightning } from './lightning.js';
import { CollDetector } from './coll-detector.js';
import { Terrain } from './el/terrain.js';
import { Clouds } from './el/clouds.js';
import { Obstacle, ObstacleManager } from './el/obstacle-manager.js';
import { Cactus } from './el/cactus.js';
import { Crow } from './el/crow.js';
import { Player } from './el/player.js';

export class Display {
    private state: GameState;
    private tick: Tick;
    private timeCycle: Time;
    private audioManager: AudioManager;

    public display: THREE.Group;
    private renderer: THREE.WebGLRenderer;

    private lightning: Lightning;
    private ambientLightColor: THREE.Color;
    private ambientLightIntensity: number;
    private directionalLight: THREE.DirectionalLight;
    private directionalLightColor: THREE.Color;
    private directionalLightIntensity: number;
    private directionalLightPosition: THREE.Vector3;

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

    constructor(
        state: GameState,
        tick: Tick, 
        timeCycle: Time,
        renderer: THREE.WebGLRenderer, 
        scene: THREE.Scene,
        audioManager: AudioManager,
    ) {
        this.state = state;
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.renderer = renderer;
        this.audioManager = audioManager

        //Lightning
            this.lightning = new Lightning(this.tick, this.timeCycle);

            this.ambientLightColor = this.lightning.getColor();
            this.ambientLightIntensity = this.lightning.getAmbientLightIntensity();

            this.directionalLight = this.lightning.getDirectionalLight();
            this.directionalLightColor = this.lightning.getDirectionalLightColor();
            this.directionalLightIntensity = this.lightning.getDirectionalLightIntensity();
            this.directionalLightPosition = this.lightning.getDirectionalLightPos();
        //
        
        this.display = new THREE.Group;
        this.loader = new OBJLoader();

        this.collDetector = new CollDetector(scene);
        this.texLoader = new THREE.TextureLoader();

        this.scene = scene;

        this.createDisplay();
    }

    size = {
        w: 0.52,
        h: 0.51,
        d: 2.5
    }

    pos = {
        x: 0,
        y: -3.75,
        z: -3.05
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
                    timeFactor: { value: this.timeCycle.getTimeFactor() },
                    map: { value: tex },
                    bounds: { value: new THREE.Vector4() },
                    shadowMap: { value: null },
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
                clipping: true
            });

            await new Promise<void>((res) => {
                this.loader.load(path, (obj) => {
                    this.mesh = obj;
    
                    this.mesh.traverse((m) => {
                        if(m instanceof THREE.Mesh) {
                            m.material = this.material;
                            m.castShadow = true;
                            m.receiveShadow = true;
                        }
                    });

                    this.mesh.scale.x = this.size.w;
                    this.mesh.scale.y = this.size.h;
                    this.mesh.scale.z = this.size.d;
    
                    this.mesh.position.x = this.pos.x,
                    this.mesh.position.y = this.pos.y,
                    this.mesh.position.z = this.pos.z;

                    this.mesh.receiveShadow = true;

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
                    this.renderCactus = new Cactus(this.tick, this.timeCycle, this, this.obstacleManager);
                    await this.renderCactus.ready();
                    const cactus = this.renderCactus.getObs();
                    
                    cactus.forEach(c => {
                        this.display.add(c);
                    });
                    
                    this.obstacleManager.addObstacle(cactus as Obstacle[]);
                //

                //Crow
                    this.renderCrow = new Crow(this.tick, this.timeCycle, this, this.obstacleManager);
                    await this.renderCrow.ready();
                    const crow = this.renderCrow.getObs();

                    crow.forEach(c => {
                        this.display.add(c);
                    });

                    this.obstacleManager.addObstacle(crow as Obstacle[]);
                //
            //

            //Player
            this.renderPlayer = new Player(this.tick, this.timeCycle, this.collDetector, this.obstacleManager.getObstacles(), this.audioManager);
            const playerObj = await this.renderPlayer.ready();
            this.display.add(playerObj);
        //

        return this.display;
    }

    public async resetState(): Promise<void> {
        this.collDetector.resetState();
        this.obstacleManager.clearObstacles();

        if(this.renderClouds) this.renderClouds.resetState();
        if(this.renderTerrain) this.renderTerrain.resetState();
        if(this.renderPlayer) this.renderPlayer.resetState();

        if(this.renderCactus) {
            this.display.remove(...this.renderCactus.getObs());
            const updCactusGroup = await this.renderCactus.resetState();
            this.display.add(updCactusGroup);
        }

        if(this.renderCrow) {
            this.display.remove(...this.renderCrow.getObs());
            this.renderCrow.resetAnimationState();
            const updCrowGroup = await this.renderCrow.resetState();
            this.display.add(updCrowGroup);
        }

        if(this.renderPlayer) this.renderPlayer.updateObs(this.obstacleManager.getObstacles());

        if(this.material) {
            this.material.uniforms.time.value = 0.0;
            this.material.uniforms.timeFactor.value = this.timeCycle.getTimeFactor();
            this.material.needsUpdate = true;
        }

        if(this.mesh) {
            this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
            this.mesh.scale.set(this.size.w, this.size.h, this.size.d);
        }

        this.getBounds();
    }

    public forceUpdate(value: {
        factor: number,
        ambientColor: THREE.Color,
        ambientLightIntensity: number,
        directionalLightColor: THREE.Color,
        directionalLightIntensity: number,
        directionalLightPosition: THREE.Vector3,
        directionalLightMatrix: THREE.Matrix4
    }) {
        this.display.traverse((obj) => {
            if(obj instanceof THREE.Mesh && obj.material instanceof THREE.ShaderMaterial) {
                obj.material.uniforms.timeFactor.value = value.factor;
                obj.material.uniforms.ambientLightColor.value = value.ambientColor;
                obj.material.uniforms.ambientLightIntensity.value = value.ambientLightIntensity;
                obj.material.uniforms.directionalLightColor.value = value.directionalLightColor;
                obj.material.uniforms.directionalLightIntensity.value = value.directionalLightIntensity;
                obj.material.uniforms.directionalLightPosition.value = value.directionalLightPosition;
                obj.material.uniforms.directionalLightMatrix.value = value.directionalLightMatrix;
                obj.material.needsUpdate = true;
            }
        })
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

        this.ambientLightColor = this.lightning.update(factor);
        this.ambientLightIntensity = this.lightning.getAmbientLightIntensity();
        this.directionalLightColor = this.lightning.getDirectionalLightColor();
        this.directionalLightIntensity = this.lightning.getDirectionalLightIntensity();
        this.directionalLightPosition = this.lightning.getDirectionalLightPos();

        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;

        this.material.uniforms.ambientLightColor.value = this.ambientLightColor;
        this.material.uniforms.ambientLightIntensity.value = this.ambientLightIntensity;

        this.material.uniforms.directionalLightColor.value = this.directionalLightColor;
        this.material.uniforms.directionalLightIntensity.value = this.directionalLightIntensity;
        this.material.uniforms.directionalLightPosition.value = this.directionalLightPosition;
        this.material.uniforms.directionalLightMatrix.value = this.directionalLight.shadow.matrix;

        this.material.needsUpdate = true;
    }

    public async ready(): Promise<THREE.Group> {
        const group = await this._mainGroup();
        return group;
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