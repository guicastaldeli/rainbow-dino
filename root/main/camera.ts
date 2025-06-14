import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/Addons.js';

import { Tick } from './tick.js';

export class Camera {
    private tick: Tick;

    public camera!: THREE.PerspectiveCamera;
    public controls!: OrbitControls;

    //Message Props
        private loader: FontLoader;
        private mesh!: THREE.Mesh;
        private material!: THREE.MeshBasicMaterial;
        private data?: any;

        private hasMessageShown: boolean = false;

        private fadeState: 'in' | 'out' | 'none' = 'none';
        private fadeProgress: number = 0;
        private fadeDuration: number = 1000;
        private showDuration: number = 3000;
        private lastFadeTime: number = 0;
    //

    constructor(tick: Tick, private renderer: THREE.WebGLRenderer) {
        this.tick = tick;

        this.initCamera();
        this.setControls();

        this.loader = new FontLoader();
        tick.onStateChange((s) => {
            if(s === 'running') {
                setTimeout(() => 
                    this.showMessage(), 
                    this.showDuration
                );
            }
        });
    }

    targetSize = {
        w: window.innerWidth,
        h: window.innerHeight
    }

    cameraProps = {
        w: this.targetSize.w,
        h: this.targetSize.h,
        fov: 95,
        near: 0.1,
        far: 1000,
        moveSpeed: 0.1,
        
        pos: {
            x: 0,
            y: 0,
            z: 1,
        },
    }

    bounds = {
        minX: -5,
        maxX: 5,

        minY: -2,
        maxY: 2,

        minZ: -1,
        maxZ: 2
    }

    private initCamera(): THREE.PerspectiveCamera {
        this.camera = new THREE.PerspectiveCamera(
            this.cameraProps.fov,
            this.cameraProps.w / this.cameraProps.h,
            this.cameraProps.near,
            this.cameraProps.far
        );

        this.camera.position.x = this.cameraProps.pos.x;
        this.camera.position.y = this.cameraProps.pos.y;
        this.camera.position.z = this.cameraProps.pos.z;

        this.resetCamera();
        
        return this.camera;
    }

    private setControls(): OrbitControls {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.update();

        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE
        }

        //Rotation...
        const halfRotation = Math.PI / 2.5;
        this.controls.minAzimuthAngle = -halfRotation;
        this.controls.maxAzimuthAngle = halfRotation;

        return this.controls;
    }

    //Message
        private async loadFont(): Promise<void> {
            try {
                this.data = await new Promise((res, rej) => {
                    const path = '../../assets/fonts/HomeVideoRegular.json';

                    this.loader.load(
                        path,
                        (font) => res(font),
                        undefined,
                        (err) => rej(err)
                    );
                });

                await this.createMessage();
            } catch(err) {
                console.log(err);
                throw err;
            }
        }

        private async showMessage(): Promise<void> {
            if(this.hasMessageShown) return;

            try {
                await this.loadFont();
                this.hasMessageShown = true;
            } catch(err) {
                console.log(err);
            }
        }

        public hideMessage(visible: boolean): void {
            if(this.mesh) this.mesh.visible = visible;
        }

        private async createMessage(): Promise<void> {
            if(!this.data) return;

            const size = {
                s: 0.06,
                d: 0
            }

            const pos = {
                x: 0,
                y: -1,
                z: -1
            }

            const text = 'To move the camera use Mouse, and Mouse Buttons. to reset, press the key "R"';

            const geometry = new TextGeometry(text, {
                font: this.data,
                size: size.s,
                depth: size.d,
                bevelEnabled: false,
            });
            
            geometry.computeBoundingBox();
            geometry.center();

            this.material = new THREE.MeshBasicMaterial({ 
                color: 'rgb(0, 0, 0)',
                transparent: true,
                opacity: 0.3
            });

            this.mesh = new THREE.Mesh(geometry, this.material);

            this.mesh.position.x = pos.x;
            this.mesh.position.y = pos.y;
            this.mesh.position.z = pos.z;

            this.camera.add(this.mesh);

            this.startFadeIn();
        }

        private startFadeIn(): void {
            this.fadeState = 'in';
            this.fadeProgress = 0;
            this.lastFadeTime = performance.now();
        }

        private startFadeOut(): void {
            this.fadeState = 'out';
            this.fadeProgress = 0;
            this.lastFadeTime = performance.now();
        }

        private updateFade(deltaTime: number): void {
            if(this.fadeState === 'none' || !this.mesh || !this.material) return;

            this.fadeProgress += deltaTime * 1000
            const normalizedProgress = Math.min(this.fadeProgress / this.fadeDuration, 1);

            if(this.fadeState === 'in') {
                this.material.opacity = THREE.MathUtils.lerp(0, 0.3, normalizedProgress);

                if(normalizedProgress >= 1) {
                    setTimeout(() => this.startFadeOut(), this.showDuration);
                }
            } else if(this.fadeState === 'out') {
                this.material.opacity = THREE.MathUtils.lerp(0.3, 0, normalizedProgress);

                if(normalizedProgress >= 1) {
                    this.fadeState = 'none';
                    this.clearMessage();
                }
            }
        }

        private clearMessage(): void {
            if(this.mesh) {
                this.camera.remove(this.mesh);
                this.mesh.geometry.dispose();
                if(this.mesh.material instanceof THREE.Material) this.mesh.material.dispose();
            }
        }
    //

    private resetCamera(): void {
        window.addEventListener('keydown', (e) => {
            const eKey = e.key.toLowerCase();

            if(eKey === 'r') {
                this.camera.position.x = this.cameraProps.pos.x;
                this.camera.position.y = this.cameraProps.pos.y;
                this.camera.position.z = this.cameraProps.pos.z;

                this.controls.target.set(0, 0, 0);
                this.controls.update();
            }
        });
    }

    public resetState(): void {
        this.camera.position.x = this.cameraProps.pos.x;
        this.camera.position.y = this.cameraProps.pos.y;
        this.camera.position.z = this.cameraProps.pos.z;

        this.controls.target.set(0, 0, 0);
        this.controls.update();

        this.hasMessageShown = true;
        this.fadeState = 'none';
        this.fadeProgress = 0;
        this.lastFadeTime = 0;

        this.clearMessage();
    }

    public update(deltaTime: number) {
        this.controls.update();

        this.camera.position.x = THREE.MathUtils.clamp(
            this.camera.position.x,
            this.bounds.minX,
            this.bounds.maxX
        );

        this.camera.position.y = THREE.MathUtils.clamp(
            this.camera.position.y,
            this.bounds.minY,
            this.bounds.maxY
        );
        
        this.camera.position.z = THREE.MathUtils.clamp(
            this.camera.position.z,
            this.bounds.minZ,
            this.bounds.maxZ
        );

        this.updateFade(deltaTime);

        const target = this.controls.target;
        target.x = THREE.MathUtils.clamp(target.x, this.bounds.minX, this.bounds.maxX);
        target.y = THREE.MathUtils.clamp(target.y, this.bounds.minY, this.bounds.maxY);
        target.z = THREE.MathUtils.clamp(target.z, this.bounds.minZ, this.bounds.maxZ);
        this.controls.target.copy(target);
    }
}