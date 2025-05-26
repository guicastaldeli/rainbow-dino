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
        far: 100,
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

    public updateCamera() {
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

        const target = this.controls.target;
        target.x = THREE.MathUtils.clamp(target.x, this.bounds.minX, this.bounds.maxX);
        target.y = THREE.MathUtils.clamp(target.y, this.bounds.minY, this.bounds.maxY);
        target.z = THREE.MathUtils.clamp(target.z, this.bounds.minZ, this.bounds.maxZ);
        this.controls.target.copy(target);
    }
}