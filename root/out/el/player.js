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
    constructor(tick, timeCycle, collDetector, obstacles) {
        this.frames = [];
        this.currentParent = null;
        this.currentFrameIndex = 0;
        this.isShifted = false;
        this.shiftFrameIndices = [4, 5, 6];
        this.shiftFrameIndex = 0;
        this.frameInterval = 0.1;
        this.frameTimer = 0;
        this.isAnimating = false;
        this.isHit = false;
        this.isGameOver = false;
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
            moveSpeed: 0.25,
        };
        this.pos = {
            x: -5,
            y: -3,
            z: -3.1
        };
        this.tex = null;
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.collDetector = collDetector;
        this.obstacles = obstacles;
        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();
        this.createPlayer();
        this.setupControls();
        this.tick.onGameOver(() => {
            this.isGameOver = true;
        });
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
                    '../../../assets/obj/dino-hit.obj',
                    '../../../assets/obj/shift-dino-0.obj',
                    '../../../assets/obj/shift-dino-1.obj',
                    '../../../assets/obj/shift-dino-2.obj',
                ];
                const texPath = {
                    default: { path: '../../../assets/textures/rd.png' },
                    hit: { path: '../../../assets/textures/dino-hit.png' },
                    shift: { path: '../../../assets/textures/shift-dino.png' }
                };
                this.tex = {
                    default: yield new Promise((res, rej) => {
                        this.texLoader.load(texPath.default.path, res, undefined, rej);
                    }),
                    hit: yield new Promise((res, rej) => {
                        this.texLoader.load(texPath.hit.path, res, undefined, rej);
                    }),
                    shift: yield new Promise((res, rej) => {
                        this.texLoader.load(texPath.shift.path, res, undefined, rej);
                    })
                };
                this.material = new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0.0 },
                        timeFactor: { value: 0.0 },
                        map: { value: this.tex.default },
                        isObs: { value: false }
                    },
                    vertexShader,
                    fragmentShader,
                    side: THREE.DoubleSide,
                    depthTest: true,
                    depthWrite: true,
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
        const { velocity, direction, moveSpeed } = this.controls;
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
            velocity.x += direction.x;
        }
        else {
            velocity.x -= velocity.x;
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
        else if (this.currentFrameIndex !== 0 && !this.isShifted) {
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
        if (this.obstacles.length > 0) {
            if (this.collDetector.playerCollision(playerBox, this.obstacles)) {
                this.hitTaken();
                this.tick.gameOver();
            }
        }
        if (this.mesh)
            this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    }
    switchFrame() {
        if (this.isShifted) {
            this.shiftFrameIndex = this.shiftFrameIndex === 1 ? 2 : 1;
            this.currentFrameIndex = this.shiftFrameIndices[this.shiftFrameIndex];
        }
        else {
            this.currentFrameIndex = this.currentFrameIndex === 1 ? 2 : 1;
        }
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
    //Hit
    hitTaken() {
        this.isHit = true;
        this.currentFrameIndex = 3;
        this.saveFrame(3);
        if (this.tex) {
            this.material.uniforms.map.value = this.tex.hit;
            this.material.needsUpdate = true;
        }
    }
    //Shift
    shiftPressed() {
        if (this.isGameOver)
            return;
        this.isShifted = !this.isShifted;
        if (this.isShifted) {
            this.shiftFrameIndex = 0;
            this.currentFrameIndex = this.shiftFrameIndices[this.shiftFrameIndex];
            this.saveFrame(this.currentFrameIndex);
            if (this.tex) {
                this.material.uniforms.map.value = this.tex.shift;
                this.material.needsUpdate = true;
            }
        }
        else {
            this.currentFrameIndex = 0;
            this.saveFrame(0);
            if (this.tex) {
                this.material.uniforms.map.value = this.isHit ? this.tex.hit : this.tex.default;
                this.material.needsUpdate = true;
            }
        }
    }
    onKeyUpdate(e) {
        if (this.isGameOver)
            return;
        const isKeyDown = e.type === 'keydown';
        switch (e.code) {
            case 'KeyD':
            case 'ArrowRight':
                this.mov.FORWARD = isKeyDown;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.mov.BACKWARD = isKeyDown;
                break;
            case 'Space':
            case 'ArrowUp':
                this.isJumping = isKeyDown;
                if (isKeyDown && this.isGrounded)
                    this.jumpVelocity = this.jumpForce;
                if (!this.isGrounded)
                    this.frameInterval = 0.08;
                if (!isKeyDown)
                    this.isJumping = false;
                break;
            case 'ShiftLeft':
            case 'ArrowDown':
                if (isKeyDown !== this.isShifted)
                    this.shiftPressed();
                break;
        }
        if (this.isGrounded)
            this.frameInterval = 0.1;
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
        if (this.isShifted)
            box.max.y *= 0.5;
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
