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
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
export class Player {
    constructor(tick, timeCycle, collDetector, cactus) {
        this.frames = [];
        this.currentParent = null;
        this.currentFrameIndex = 0;
        this.frameInterval = 0.1;
        this.frameTimer = 0;
        this.isAnimating = false;
        this.gravity = -30;
        this.isGrounded = false;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.jumpForce = 13.5;
        this.mov = {
            FORWARD: false,
            BACKWARD: false,
        };
        this.controls = {
            velocity: new THREE.Vector3(),
            direction: new THREE.Vector3(),
            moveSpeed: 1.0,
            acceleration: 15.0,
            deceleration: 80.0,
        };
        this.pos = {
            x: -5,
            y: -3,
            z: -3.1
        };
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.collDetector = collDetector;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
        this.createPlayer();
        this.setupControls();
        this.cactus = cactus;
    }
    createPlayer() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [vertexShader, fragmentShader] = yield Promise.all([
                    this.loadShader('./el/shaders/vertexShader.glsl'),
                    this.loadShader('./el/shaders/fragShader.glsl')
                ]);
                const framePath = [
                    '../../../assets/obj/dino-0.obj',
                    '../../../assets/obj/dino-1.obj',
                    '../../../assets/obj/dino-2.obj',
                ];
                const texPath = '../../../assets/textures/rd.png';
                const tex = this.texLoader.load(texPath);
                this.material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0.0 },
                        timeFactor: { value: 0.0 },
                        map: { value: tex },
                        isObs: { value: false }
                    },
                    vertexShader,
                    fragmentShader,
                    side: THREE.DoubleSide,
                });
                const load = framePath.map(path => {
                    return new Promise((res) => {
                        this.loader.load(path, (obj) => {
                            obj.traverse((m) => {
                                if (m instanceof THREE.Mesh)
                                    m.material = this.material;
                            });
                            res(obj);
                        });
                    });
                });
                this.frames = yield Promise.all(load);
                this.mesh = this.frames[0];
                this.mesh.position.x = this.pos.x;
                this.mesh.position.y = this.pos.y;
                this.mesh.position.z = this.pos.z;
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    updateMov(deltaTime) {
        const { velocity, direction, moveSpeed, acceleration, deceleration, } = this.controls;
        if (!this.mesh)
            return;
        const prevPos = Object.assign({}, this.pos);
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        //Direction
        direction.set(0, 0, 0);
        if (this.mov.FORWARD)
            direction.x += 1;
        if (this.mov.BACKWARD)
            direction.x -= 1;
        if (direction.lengthSq() > 0) {
            const accel = acceleration * scaledDelta;
            velocity.x += direction.x * accel;
        }
        else {
            const decel = deceleration * scaledDelta;
            velocity.x -= velocity.x * decel;
        }
        //Jump
        if (this.isJumping && this.isGrounded) {
            this.jumpVelocity = this.jumpForce;
            this.isGrounded = false;
            this.isJumping = false;
        }
        this.jumpVelocity += this.gravity * scaledDelta;
        this.pos.y += this.jumpVelocity * scaledDelta;
        if (this.pos.y <= -3) {
            this.pos.y = -3;
            this.jumpVelocity = 0;
            this.isGrounded = true;
        }
        //Animation
        if (this.isAnimating) {
            this.frameTimer += scaledDelta;
            if (this.frameTimer >= this.frameInterval) {
                this.frameTimer = 0;
                this.switchFrame();
            }
        }
        else if (this.currentFrameIndex !== 0) {
            this.currentFrameIndex = 0;
            this.saveFrame(0);
        }
        //Collision
        const updX = this.pos.x + velocity.x * scaledDelta * moveSpeed;
        this.mesh.position.set(updX, this.pos.y, this.pos.z);
        const playerBox = this.getBoundingBox();
        if (this.collDetector.outDisplayBounds(playerBox)) {
            this.pos.x = prevPos.x;
            velocity.x = 0;
        }
        else {
            this.pos.x = updX;
        }
        if (this.cactus) {
            if (this.collDetector.playerCollision(playerBox, this.cactus.getObs())) {
                console.log('tst');
            }
        }
        if (this.mesh)
            this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    }
    switchFrame() {
        this.currentFrameIndex = this.currentFrameIndex === 1 ? 2 : 1;
        this.saveFrame(this.currentFrameIndex);
    }
    saveFrame(i) {
        if (!this.frames[i])
            return;
        const pos = this.mesh.position.clone();
        this.currentParent = this.mesh.parent;
        if (this.currentParent)
            this.currentParent.remove(this.mesh);
        this.mesh = this.frames[i].clone();
        this.mesh.position.copy(pos);
        if (this.currentParent)
            this.currentParent.add(this.mesh);
    }
    onKeyUpdate(e) {
        const isKeyDown = e.type === 'keydown';
        switch (e.code) {
            case 'KeyD':
                this.mov.FORWARD = isKeyDown;
                break;
            case 'KeyA':
                this.mov.BACKWARD = isKeyDown;
                break;
            case 'Space':
                this.isJumping = isKeyDown;
                if (isKeyDown && this.isGrounded)
                    this.jumpVelocity = this.jumpForce;
                if (!isKeyDown)
                    this.isJumping = false;
                break;
        }
        this.isAnimating = this.mov.FORWARD || this.mov.BACKWARD || this.isJumping;
    }
    setupControls() {
        window.addEventListener('keydown', (e) => this.onKeyUpdate(e));
        window.addEventListener('keyup', (e) => this.onKeyUpdate(e));
    }
    getBoundingBox() {
        if (!this.mesh)
            return new THREE.Box3();
        const box = new THREE.Box3().setFromObject(this.mesh);
        return box;
    }
    loadShader(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield fetch(url);
            if (!res.ok)
                throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
            return yield res.text();
        });
    }
    update(deltaTime) {
        if (!this.material)
            return;
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        this.updateMov(scaledDelta);
        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001 * this.tick.getTimeScale();
        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }
    ready() {
        return new Promise(res => {
            if (!this.mesh) {
                const _check = () => this.mesh ? res(this.mesh) : setTimeout(_check, 0);
                _check();
            }
        });
    }
}
