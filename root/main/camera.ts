import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Camera {
    public camera!: THREE.PerspectiveCamera;
    public controls!: OrbitControls;

    constructor(private renderer: THREE.WebGLRenderer) {
        this.initCamera();
        this.setControls();
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

        pos: {
            x: 0,
            y: 0,
            z: 5,
        }
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
        
        return this.camera;
    }

    private setControls(): OrbitControls {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.update();

        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE
        }

        return this.controls;
    }

    public updateCamera() {
        this.controls.update();
    }
}