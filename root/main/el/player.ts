import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { Tick } from '../tick';
import { Time } from '../time';
import { CollDetector } from '../coll-detector.js';

import { Cactus } from './cactus';

interface MovState {
    FORWARD: boolean;
    BACKWARD: boolean;
}

interface Controls {
    velocity: THREE.Vector3;
    direction: THREE.Vector3;
    moveSpeed: number;
    acceleration: number;
    deceleration: number;
}

export class Player {
    private tick: Tick;
    private timeCycle: Time;

    private frames: THREE.Object3D[] = [];
    private currentParent: THREE.Object3D | null = null;
    private currentFrameIndex = 0;
    private frameInterval = 0.1;
    private frameTimer = 0;
    private isAnimating = false;

    private loader!: OBJLoader;
    private texLoader!: THREE.TextureLoader;
    private mesh!: THREE.Object3D;
    private material!: THREE.ShaderMaterial;

    private gravity = -30;
    private isGrounded = false;

    private isJumping = false;
    private jumpVelocity = 0;
    private jumpForce = 13.5;

    private collDetector: CollDetector;

    private cactus?: Cactus;

    private mov: MovState = {
        FORWARD: false,
        BACKWARD: false,
    }

    private controls: Controls = {
        velocity: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        moveSpeed: 1.0,
        acceleration: 15.0,
        deceleration: 80.0,
    }

    pos = {
        x: -5,
        y: -3,
        z: -3.1
    }

    constructor(tick: Tick, timeCycle: Time, collDetector: CollDetector, cactus?: Cactus) {
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.collDetector = collDetector;

        this.loader = new OBJLoader();
        this.texLoader = new THREE.TextureLoader();

        this.createPlayer();
        this.setupControls();

        this.cactus = cactus;
    }
    
    private async createPlayer() {
        try {
            const [vertexShader, fragmentShader] = await Promise.all([
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
                return new Promise<THREE.Object3D>((res) => {
                    this.loader.load(path, (obj) => {
                        obj.traverse((m) => {
                            if(m instanceof THREE.Mesh) m.material = this.material;
                        });

                        res(obj);
                        
                    });
                });
            });
            
            this.frames = await Promise.all(load);

            this.mesh = this.frames[0];
            this.mesh.position.x = this.pos.x;
            this.mesh.position.y = this.pos.y;
            this.mesh.position.z = this.pos.z;
        } catch(err) {
            console.log(err);
        }
    }

    private updateMov(deltaTime: number) {
        const {
            velocity,
            direction,
            moveSpeed,
            acceleration,
            deceleration,
        } = this.controls;
        if(!this.mesh) return;
        const prevPos = {...this.pos};
        const scaledDelta = this.tick.getScaledDelta(deltaTime);

        //Direction
        direction.set(0, 0, 0);
        if(this.mov.FORWARD) direction.x += 1;
        if(this.mov.BACKWARD) direction.x -= 1;

        if(direction.lengthSq() > 0) {
            const accel = acceleration * scaledDelta;
            velocity.x += direction.x * accel;
        } else {
            const decel = deceleration * scaledDelta;
            velocity.x -= velocity.x * decel;
        }

        //Jump
        if(this.isJumping && this.isGrounded) {
            this.jumpVelocity = this.jumpForce;
            this.isGrounded = false;
            this.isJumping = false;
        }

        this.jumpVelocity += this.gravity * scaledDelta;
        this.pos.y += this.jumpVelocity * scaledDelta;

        if(this.pos.y <= -3) {
            this.pos.y = -3;
            this.jumpVelocity = 0;
            this.isGrounded = true;
        }

        //Animation
        if(this.isAnimating) {
            this.frameTimer += scaledDelta;

            if(this.frameTimer >= this.frameInterval) {
                this.frameTimer = 0;
                this.switchFrame();
            }
        } else if(this.currentFrameIndex !== 0) {
            this.currentFrameIndex = 0;
            this.saveFrame(0);
        }

        //Collision
        const updX = this.pos.x + velocity.x * scaledDelta * moveSpeed;
        this.mesh.position.set(updX, this.pos.y, this.pos.z);
        const playerBox = this.getBoundingBox();
    
        if(this.collDetector.outDisplayBounds(playerBox)) {
            this.pos.x = prevPos.x;
            velocity.x = 0;
        } else {
            this.pos.x = updX;
        }

        if(this.cactus) {
            if(this.collDetector.playerCollision(playerBox, this.cactus.getObs())) {
                console.log('tst');
            }
        }

        if(this.mesh) this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    }

    private switchFrame() {
        this.currentFrameIndex = this.currentFrameIndex === 1 ? 2 : 1;
        this.saveFrame(this.currentFrameIndex);
    }

    private saveFrame(i: number) {
        if(!this.frames[i]) return;

        const pos = this.mesh.position.clone();
        this.currentParent = this.mesh.parent;

        if(this.currentParent) this.currentParent.remove(this.mesh);
        this.mesh = this.frames[i].clone();
        this.mesh.position.copy(pos);

        if(this.currentParent) this.currentParent.add(this.mesh);
    }

    private onKeyUpdate(e: KeyboardEvent) {
        const isKeyDown = e.type === 'keydown';

        switch(e.code) {
            case 'KeyD':
                this.mov.FORWARD = isKeyDown;
                break;
            case 'KeyA':
                this.mov.BACKWARD = isKeyDown;
                break;
            case 'Space':
                this.isJumping = isKeyDown;
                if(isKeyDown && this.isGrounded) this.jumpVelocity = this.jumpForce;
                if(!isKeyDown) this.isJumping = false;
                break;
        }

        this.isAnimating = this.mov.FORWARD || this.mov.BACKWARD || this.isJumping;
    }

    private setupControls() {
        window.addEventListener('keydown', (e) => this.onKeyUpdate(e));
        window.addEventListener('keyup', (e) => this.onKeyUpdate(e));
    }

    public getBoundingBox(): THREE.Box3 {
        if(!this.mesh) return new THREE.Box3();
        const box = new THREE.Box3().setFromObject(this.mesh);
        return box;
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return await res.text();
    }

    public update(deltaTime: number) {        
        if(!this.material) return;
        
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        this.updateMov(scaledDelta);

        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001 * this.tick.getTimeScale();

        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }

    public ready(): Promise<THREE.Object3D> {
        return new Promise(res => {
            if(!this.mesh) {
                const _check = () => this.mesh ? res(this.mesh) : setTimeout(_check, 0);
                _check();
            }
        });
    }
}