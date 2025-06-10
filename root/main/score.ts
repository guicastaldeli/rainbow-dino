import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/Addons.js';

import { GameState } from './game-state';
import { Tick } from './tick';
import { Time } from './time';

export class Score {
    private state: GameState;
    private tick: Tick;
    private timeCycle: Time;

    private finalScore!: number;

    private loader: FontLoader;
    private mesh!: THREE.Mesh;
    private material!: THREE.ShaderMaterial;

    private data?: any;
    private value: number;
    private readonly maxScore = 9999999;
    private readonly scoreMultiplier = 100;

    private isBlinking = false;
    private blinkInterval?: number;

    constructor(state: GameState, tick: Tick, timeCycle: Time) {
        this.state = state;
        this.tick = tick;
        this.timeCycle = timeCycle;

        this.loader = new FontLoader();
        this.loadFont();

        this.value = 0.0;
    }

    size = {
        s: 0.5,
        d: 0.02
    }

    pos = {
        x: 5,
        y: 3,
        z: -4
    }

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

            this.createScore();
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    private async createScore(): Promise<void> {
        try {
            if(!this.data) return;

            const text = Math.floor(this.value).toString().padStart(7, '0');
        
            const geometry = new TextGeometry(text, {
                font: this.data,
                size: this.size.s,
                depth: this.size.d,
                bevelEnabled: false,
            });

            const [vertexShader, fragmentShader] = await Promise.all([
                this.loadShader('../main/shaders/scoreVertexShader.glsl'),
                this.loadShader('../main/shaders/scoreFragShader.glsl')
            ]);

            this.material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    timeFactor: { value: 0.0 },
                    shouldBlink: { value: false }
                },
                vertexShader,
                fragmentShader,
                side: THREE.DoubleSide
            });

            if(!this.mesh) {
                this.mesh = new THREE.Mesh(geometry, this.material);
        
                this.mesh.position.x = this.pos.x;
                this.mesh.position.y = this.pos.y;
                this.mesh.position.z = this.pos.z;
            } else {
                this.mesh.geometry.dispose();
                this.mesh.geometry = geometry;
            }
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    public getScore(): THREE.Mesh {
        if(!this.mesh) throw new Error('mesh err');
        return this.mesh;
    }

    public getCurrentScore(): number {
        return Math.floor(this.value);
    }

    private saveScore(): number {
        this.finalScore = this.getCurrentScore();
        localStorage.setItem('final-score', this.finalScore.toString());
        return this.finalScore;
    }

    public getFinalScore(): number {
        return this.saveScore();
    }

    private activateBlink(): void {
        if(this.isBlinking) {
            this.material.uniforms.shouldBlink.value = this.isBlinking;
        }
    }
    
    private updateValue(): number {
        const scrollSpeed = Math.max(this.timeCycle.updateSpeed(), 0.1);
        const increment = (0.0005 * this.scoreMultiplier) * scrollSpeed;
        const updValue = Math.min(this.value + increment, this.maxScore);

        if(this.tick.getTimeScale() > 0) {
            const prevThousands = Math.floor(this.value / 100);
            const newThousands = Math.floor(updValue / 100);

            if(newThousands > prevThousands) {
                this.isBlinking = true;
                this.activateBlink();

                setTimeout(() => {
                    this.isBlinking = false;
                }, 1000);
            }

            this.value = updValue;
        }

        return this.value;
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return res.text();
    }

    public update(deltaTime: number): void {
        if(!this.mesh || !this.data) return;

        this.createScore();
        this.updateValue();

        const factor = this.timeCycle.getTimeFactor();
        const totalTime = performance.now() * 0.001 * this.tick.getTimeScale();
        
        this.material.uniforms.time.value = totalTime;
        this.material.uniforms.timeFactor.value = factor;
        this.material.needsUpdate = true;
    }

    public async ready(): Promise<THREE.Mesh> {
        try {
            while(!this.mesh) await new Promise(res => setTimeout(res, 100));
            return this.getScore();
        } catch(err) {
            console.log(err);
            throw err;
        }
    }
}