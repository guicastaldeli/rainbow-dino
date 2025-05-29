import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Time } from './time.js';
import { ClipDetector } from './clip-detector.js';
import { Terrain } from './el/terrain.js';
import { Player } from './el/player.js';

export class Display {
    private timeCycle: Time;

    public display: THREE.Group;
    private renderer: THREE.WebGLRenderer;
    private clippingPlanes: THREE.Plane[];
    private clipDetector = new ClipDetector();

    private mesh!: THREE.Object3D;
    private loader!: OBJLoader;
    private texLoader!: THREE.TextureLoader;
    private material!: THREE.ShaderMaterial;

    //Elements
    private renderPlayer!: Player;

    constructor(timeCycle: Time, renderer: THREE.WebGLRenderer) {
        this.timeCycle = timeCycle;
        this.renderer = renderer;
        this.renderer.localClippingEnabled = true;

        this.display = new THREE.Group;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();

        this.clippingPlanes = [
            new THREE.Plane(new THREE.Vector3(1, 0, 0)),   //Right
            new THREE.Plane(new THREE.Vector3(-1, 0, 0)),  //Left
            new THREE.Plane(new THREE.Vector3(0, 1, 0)),   //Top
            new THREE.Plane(new THREE.Vector3(0, -1, 0)),  //Bottom
            new THREE.Plane(new THREE.Vector3(0, 0, -1)),
        ]

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

            await new Promise<void>((res) => {
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

                    this.updateClipping();
                    res();
                });
            })
        } catch(err) {
            console.log(err);
        }
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return await res.text();
    }

    private updateClipping() {
        if(!this.mesh) return;
        this.clipDetector.updateBounds(this.mesh, this.size);
    }

    private _applyClipping(obj: THREE.Object3D): void {
        obj.traverse(o => {
            if(o instanceof THREE.Mesh) {
                const mat = Array.isArray(o.material) ? o.material : [o.material];
                const updMat = mat.map(m => {
                    const newMat = m.clone();
                    newMat.clippingPlanes = this.clippingPlanes;
                    return newMat;
                });
                o.material = Array.isArray(o.material) ? updMat : updMat[0];
            }
        });
    }

    private async _mainGroup(): Promise<THREE.Group> {
        this.display = new THREE.Group();

        if(!this.mesh) {
            await new Promise(res => {
                const __check = () => this.mesh ? res(true) : setTimeout(__check, 0); 
                __check();
            });
        }
        
        this.display.add(this.mesh);
        this._applyClipping(this.display);

        //Render
            //Terrain
            const renderTerrain = new Terrain();
            this._applyClipping(renderTerrain.mesh);
            this.display.add(renderTerrain.mesh);

            //Player
            this.renderPlayer = new Player(this.timeCycle);
            const playerObj = await this.renderPlayer.ready();
            this._applyClipping(playerObj);
            this.display.add(playerObj);

        //

        this.updateClipping();
        return this.display;
    }

    public update(deltaTime: number) {
        if(!this.material || !this.mesh) return;
        if(this.renderPlayer) this.renderPlayer.update(deltaTime);

        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001;

        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate;

        this.updateClipping();
        this.clipDetector.checkAllObjs(this.display);
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