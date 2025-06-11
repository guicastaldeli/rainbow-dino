import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import { GameState } from '../game-state';
import { Tick } from '../tick';
import { Time } from '../time';
import { Lightning } from '../lightning.js';
import { CollDetector } from '../coll-detector.js';

import { Obstacle } from './obstacle-manager';

interface MovState {
    FORWARD: boolean;
    BACKWARD: boolean;
}

interface Controls {
    velocity: THREE.Vector3;
    direction: THREE.Vector3;
    moveSpeed: number;
}

export class Player {
    private tick: Tick;
    private timeCycle: Time;

    private lightning: Lightning;
    private ambientLightColor: THREE.Color;
    private ambientLightIntensity: number;
    private directionalLight: THREE.DirectionalLight;
    private directionalLightColor: THREE.Color;
    private directionalLightIntensity: number;
    private directionalLightPosition: THREE.Vector3;

    private loader!: OBJLoader;
    private texLoader!: THREE.TextureLoader;
    private mesh!: THREE.Object3D;
    private material!: THREE.ShaderMaterial;

    private frames: THREE.Object3D[] = [];
    private currentParent: THREE.Object3D | null = null;
    private currentFrameIndex = 0;
    private isShifted = false;
    private shiftFrameIndices = [4, 5, 6];
    private shiftFrameIndex = 0;
    private frameInterval = 0.1;
    private frameTimer = 0;
    private isAnimating = false;
    private isHit = false;
    private isGameOver = false;

    private gravity = -30;
    private isGrounded = false;

    private isJumping = false;
    private jumpVelocity = 0;
    private jumpForce = 13.5;

    private collDetector?: CollDetector;

    private obstacles?: Obstacle[];

    private mov: MovState = {
        FORWARD: false,
        BACKWARD: false,
    }

    private controls: Controls = {
        velocity: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        moveSpeed: 0.25,
    }

    pos = {
        x: -5,
        y: -3,
        z: -3.13
    }

    private tex: {
        default: THREE.Texture,
        hit: THREE.Texture,
        shift: THREE.Texture
    } | null = null;

    constructor(
        tick: Tick, 
        timeCycle: Time, 
        collDetector?: CollDetector, 
        obstacles?: Obstacle[]
    ) {
        this.tick = tick;
        this.timeCycle = timeCycle;

        //Lightning
            this.lightning = new Lightning(this.tick, this.timeCycle);

            this.ambientLightColor = this.lightning.getColor();
            this.ambientLightIntensity = this.lightning.getAmbientLightIntensity();

            this.directionalLight = this.lightning.getDirectionalLight();
            this.directionalLightColor = this.lightning.getDirectionalLightColor();
            this.directionalLightIntensity = this.lightning.getDirectionalLightIntensity();
            this.directionalLightPosition = this.lightning.getDirectionalLightPos();
        //

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
                default: await new Promise<THREE.Texture>((res, rej) => {
                    this.texLoader.load(texPath.default.path, res, undefined, rej);
                }),
                hit: await new Promise<THREE.Texture>((res, rej) => {
                    this.texLoader.load(texPath.hit.path, res, undefined, rej);
                }),
                shift: await new Promise<THREE.Texture>((res, rej) => {
                    this.texLoader.load(texPath.shift.path, res, undefined, rej);
                })
            }
            
            this.material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    timeFactor: { value: 0.0 },
                    map: { value: this.tex.default },
                    isObs: { value: false },
                    isCloud: { value: false },
                    shadowMap: { value: null },
                    shadowBias: { value: 0.01 },
                    shadowRadius: { value: 1.0 },
                    ambientLightColor: { value: this.ambientLightColor },
                    ambientLightIntensity: { value: this.ambientLightIntensity },
                    directionalLightColor: { value: this.directionalLightColor },
                    directionalLightIntensity: { value: this.directionalLightIntensity },
                    directionalLightPosition: { value: this.directionalLightPosition },
                    directionalLightMatrix: { value: new THREE.Matrix4() }
                },
                vertexShader,
                fragmentShader,
                side: THREE.DoubleSide,
                depthTest: true,
                depthWrite: true,
            });
    
            const load = framePath.map(path => {
                return new Promise<THREE.Object3D>((res) => {
                    this.loader.load(path, (obj) => {
                        obj.traverse((m) => {
                            if(m instanceof THREE.Mesh) {
                                m.material = this.material;
                                m.receiveShadow = true;
                                m.castShadow = true;
                            }
                        });

                        res(obj);
                    });
                });
            });
            
            this.frames = await Promise.all(load);

            this.mesh = this.frames[0];
            this.mesh.name = 'player';
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
            moveSpeed
        } = this.controls;
        if(!this.mesh) return;
        const prevPos = {...this.pos};
        const scaledDelta = this.tick.getScaledDelta(deltaTime);

        //Direction
        direction.set(0, 0, 0);
        if(this.mov.FORWARD) direction.x += 1;
        if(this.mov.BACKWARD) direction.x -= 1;

        if(direction.lengthSq() > 0) {
            velocity.x += direction.x;
        } else {
            velocity.x -= velocity.x;
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
        } else if(this.currentFrameIndex !== 0 && !this.isShifted) {
            this.currentFrameIndex = 0;
            this.saveFrame(0);
        }

        //Collision
        const updX = this.pos.x + velocity.x * scaledDelta * moveSpeed;
        this.mesh.position.set(updX, this.pos.y, this.pos.z);
        const playerBox = this.getBoundingBox();
        if(!this.collDetector || !this.obstacles) return;
    
        if(this.collDetector.outDisplayBounds(playerBox)) {
            this.pos.x = prevPos.x;
            velocity.x = 0;
        } else {
            this.pos.x = updX;
        }

        if(this.obstacles.length > 0) {
            if(this.collDetector.playerCollision(playerBox, this.obstacles)) {
                this.hitTaken();
                this.tick.setGameOver();
            }
        }

        if(this.mesh) this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    }

    private switchFrame() {
        if(this.isShifted) {
            this.shiftFrameIndex = this.shiftFrameIndex === 1 ? 2 : 1;
            this.currentFrameIndex = this.shiftFrameIndices[this.shiftFrameIndex];
        } else {
            this.currentFrameIndex = this.currentFrameIndex === 1 ? 2 : 1;
        }

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

    //Hit
    private hitTaken(): void {
        this.isHit = true;
        this.currentFrameIndex = 3;
        this.saveFrame(3);
                
        if(this.tex) {
            this.material.uniforms.map.value = this.tex.hit;
            this.material.needsUpdate = true;
        }
    }

    //Shift
    private async shiftPressed(): Promise<void> {
        if(this.isGameOver || this.tick.isPaused()) return;
        this.isShifted = !this.isShifted;

        if(this.isShifted) {
            this.shiftFrameIndex = 0;
            this.currentFrameIndex = this.shiftFrameIndices[this.shiftFrameIndex];
            this.saveFrame(this.currentFrameIndex);

            if(this.tex) {
                this.material.uniforms.map.value = this.tex.shift;
                this.material.needsUpdate = true;
            }
        } else {
            this.currentFrameIndex = 0;
            this.saveFrame(0);

            if(this.tex) {
                this.material.uniforms.map.value = this.isHit ? this.tex.hit : this.tex.default;
                this.material.needsUpdate = true;
            }
        }
    }

    private async onKeyUpdate(e: KeyboardEvent) {
        if(this.isGameOver || this.tick.isPaused()) return;
        const isKeyDown = e.type === 'keydown';

        switch(e.code) {
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
                if(isKeyDown && this.isGrounded) this.jumpVelocity = this.jumpForce;
                if(!this.isGrounded) this.frameInterval = 0.08;
                if(!isKeyDown) this.isJumping = false;
                break;
            case 'ShiftLeft':
            case 'ArrowDown':
                if(isKeyDown !== this.isShifted) this.shiftPressed();
                break;
        }

        if(this.isGrounded) this.frameInterval = 0.1;
        this.isAnimating = this.mov.FORWARD || this.mov.BACKWARD || this.isJumping;
    }

    private setupControls() {
        window.addEventListener('keydown', (e) => this.onKeyUpdate(e));
        window.addEventListener('keyup', (e) => this.onKeyUpdate(e));
    }

    public getBoundingBox(): THREE.Box3 {
        if(!this.mesh) return new THREE.Box3();
        const box = new THREE.Box3().setFromObject(this.mesh);

        if(this.isShifted) box.max.y *= 0.5;
        
        return box;
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return await res.text();
    }

    public resetState(): void {
        this.pos = {
            x: -5,
            y: -3,
            z: -3.13
        }

        this.mov = {
            FORWARD: false,
            BACKWARD: false
        }

        this.controls.velocity.set(0, 0, 0);
        this.controls.direction.set(0, 0, 0);

        this.isHit = false;
        this.isGameOver = false;
        this.isShifted = false;
        this.isJumping = false;
        this.isGrounded = false;
        this.jumpVelocity = 0;
        
        this.currentFrameIndex = 0;
        this.saveFrame(0);
        
        if(this.tex) {
            this.material.uniforms.map.value = this.tex.default;
            this.material.needsUpdate = true;
        }

        if(this.mesh) this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    }

    public update(deltaTime: number) {        
        if(!this.material) return;
        
        const scaledDelta = this.tick.getScaledDelta(deltaTime);
        this.updateMov(scaledDelta);

        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * this.timeCycle['initSpeed'] * this.tick.getTimeScale();
        const ambientColor = this.lightning.update(factor);

        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;

        this.material.uniforms.ambientLightColor.value = ambientColor;
        this.material.uniforms.ambientLightIntensity.value = this.ambientLightIntensity;

        this.material.uniforms.directionalLightColor.value = this.directionalLightColor;
        this.material.uniforms.directionalLightIntensity.value = this.directionalLightIntensity;
        this.material.uniforms.directionalLightPosition.value = this.directionalLightPosition;
        this.material.uniforms.directionalLightMatrix.value = this.directionalLight.shadow.matrix;

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