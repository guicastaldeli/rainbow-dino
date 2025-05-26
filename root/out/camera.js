import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export class Camera {
    constructor(renderer) {
        this.renderer = renderer;
        this.targetSize = {
            w: window.innerWidth,
            h: window.innerHeight
        };
        this.cameraProps = {
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
        };
        this.initCamera();
        this.setControls();
    }
    initCamera() {
        this.camera = new THREE.PerspectiveCamera(this.cameraProps.fov, this.cameraProps.w / this.cameraProps.h, this.cameraProps.near, this.cameraProps.far);
        this.camera.position.x = this.cameraProps.pos.x;
        this.camera.position.y = this.cameraProps.pos.y;
        this.camera.position.z = this.cameraProps.pos.z;
        return this.camera;
    }
    setControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.update();
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE
        };
        return this.controls;
    }
    updateCamera() {
        this.controls.update();
    }
}
