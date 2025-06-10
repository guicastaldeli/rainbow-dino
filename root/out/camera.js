var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/Addons.js';
export class Camera {
    //
    constructor(tick, renderer) {
        this.renderer = renderer;
        this.hasMessageShown = false;
        this.fadeState = 'none';
        this.fadeProgress = 0;
        this.fadeDuration = 1000;
        this.showDuration = 3000;
        this.lastFadeTime = 0;
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
            moveSpeed: 0.1,
            pos: {
                x: 0,
                y: 0,
                z: 1,
            },
        };
        this.bounds = {
            minX: -5,
            maxX: 5,
            minY: -2,
            maxY: 2,
            minZ: -1,
            maxZ: 2
        };
        this.tick = tick;
        this.initCamera();
        this.setControls();
        this.loader = new FontLoader();
        setTimeout(() => this.showMessage(), this.showDuration);
    }
    initCamera() {
        this.camera = new THREE.PerspectiveCamera(this.cameraProps.fov, this.cameraProps.w / this.cameraProps.h, this.cameraProps.near, this.cameraProps.far);
        this.camera.position.x = this.cameraProps.pos.x;
        this.camera.position.y = this.cameraProps.pos.y;
        this.camera.position.z = this.cameraProps.pos.z;
        this.resetCamera();
        return this.camera;
    }
    setControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.update();
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE
        };
        //Rotation...
        const halfRotation = Math.PI / 2.5;
        this.controls.minAzimuthAngle = -halfRotation;
        this.controls.maxAzimuthAngle = halfRotation;
        return this.controls;
    }
    //Message
    loadFont() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.data = yield new Promise((res, rej) => {
                    const path = '../../assets/fonts/HomeVideoRegular.json';
                    this.loader.load(path, (font) => res(font), undefined, (err) => rej(err));
                });
                yield this.createMessage();
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
    showMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasMessageShown)
                return;
            try {
                yield this.loadFont();
                this.hasMessageShown = true;
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    createMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.data)
                return;
            const size = {
                s: 0.08,
                d: 0
            };
            const pos = {
                x: 0,
                y: -0.8,
                z: -1
            };
            const text = 'To reset camera, press the key "R"';
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
        });
    }
    startFadeIn() {
        this.fadeState = 'in';
        this.fadeProgress = 0;
        this.lastFadeTime = performance.now();
    }
    startFadeOut() {
        this.fadeState = 'out';
        this.fadeProgress = 0;
        this.lastFadeTime = performance.now();
    }
    updateFade(deltaTime) {
        if (this.fadeState === 'none' || !this.mesh || !this.material)
            return;
        this.fadeProgress += deltaTime * 1000;
        const normalizedProgress = Math.min(this.fadeProgress / this.fadeDuration, 1);
        if (this.fadeState === 'in') {
            this.material.opacity = THREE.MathUtils.lerp(0, 0.3, normalizedProgress);
            if (normalizedProgress >= 1) {
                setTimeout(() => this.startFadeOut(), this.showDuration);
            }
        }
        else if (this.fadeState === 'out') {
            this.material.opacity = THREE.MathUtils.lerp(0.3, 0, normalizedProgress);
            if (normalizedProgress >= 1) {
                this.fadeState = 'none';
                this.clearMessage();
            }
        }
    }
    clearMessage() {
        if (this.mesh) {
            this.camera.remove(this.mesh);
            this.mesh.geometry.dispose();
            if (this.mesh.material instanceof THREE.Material)
                this.mesh.material.dispose();
        }
    }
    //
    resetCamera() {
        window.addEventListener('keydown', (e) => {
            const eKey = e.key.toLowerCase();
            if (eKey === 'r') {
                this.camera.position.x = this.cameraProps.pos.x;
                this.camera.position.y = this.cameraProps.pos.y;
                this.camera.position.z = this.cameraProps.pos.z;
                this.controls.target.set(0, 0, 0);
                this.controls.update();
            }
        });
    }
    resetState() {
        this.camera.position.x = this.cameraProps.pos.x;
        this.camera.position.y = this.cameraProps.pos.y;
        this.camera.position.z = this.cameraProps.pos.z;
        this.controls.target.set(0, 0, 0);
        this.controls.update();
        this.hasMessageShown = false;
        this.fadeState = 'none';
        this.fadeProgress = 0;
        this.lastFadeTime = 0;
        this.clearMessage();
        setTimeout(() => this.showMessage(), this.showDuration);
    }
    update(deltaTime) {
        this.controls.update();
        this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, this.bounds.minX, this.bounds.maxX);
        this.camera.position.y = THREE.MathUtils.clamp(this.camera.position.y, this.bounds.minY, this.bounds.maxY);
        this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, this.bounds.minZ, this.bounds.maxZ);
        this.updateFade(deltaTime);
        const target = this.controls.target;
        target.x = THREE.MathUtils.clamp(target.x, this.bounds.minX, this.bounds.maxX);
        target.y = THREE.MathUtils.clamp(target.y, this.bounds.minY, this.bounds.maxY);
        target.z = THREE.MathUtils.clamp(target.z, this.bounds.minZ, this.bounds.maxZ);
        this.controls.target.copy(target);
    }
}
