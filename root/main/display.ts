import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Time } from './time.js';
import { Terrain } from './el/terrain.js';
import { Player } from './el/player.js';

export class Display {
    private timeCycle: Time;

    public display: THREE.Group;

    private mesh!: THREE.Object3D;
    private loader!: OBJLoader;
    private texLoader!: THREE.TextureLoader;
    private material!: THREE.ShaderMaterial;

    //Elements
    private renderPlayer!: Player;

    constructor(timeCycle: Time) {
        this.timeCycle = timeCycle;

        this.display = new THREE.Group;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();

        this.createDisplay();
    }

    size = {
        w: 2,
        h: 1.8,
        d: 0.1
    }

    pos = {
        x: 0,
        y: -3.5,
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
                    map: { value: tex }
                },
                vertexShader,
                fragmentShader,
                side: THREE.DoubleSide
            });

            this.loader.load(path, (obj) => {
                this.mesh = obj;

                this.mesh.traverse((m) => {
                    if(m instanceof THREE.Mesh) m.material = this.material;
                });

                this.mesh.scale.x = this.size.w;
                this.mesh.scale.y = this.size.h;

                this.mesh.position.x = this.pos.x,
                this.mesh.position.y = this.pos.y,
                this.mesh.position.z = this.pos.z;
            });
        } catch(err) {
            console.log(err);
        }
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
                const __checkMesh = () => {
                    if(this.mesh) {
                        res(true);
                    } else {
                        setTimeout(__checkMesh, 0);
                    }
                }
                
                __checkMesh();
            });
        }
        
        this.display.add(this.mesh);

        //Render
            //Terrain
            const renderTerrain = new Terrain();
            this.display.add(renderTerrain.mesh);

            //Player
            this.renderPlayer = new Player(this.timeCycle);
            const playerObj = await this.renderPlayer.ready();
            this.display.add(playerObj);

        //

        return this.display;
    }

    public update(deltaTime: number) {
        if(!this.material) return;
        if(this.renderPlayer) this.renderPlayer.update(deltaTime);

        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001;

        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate;
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