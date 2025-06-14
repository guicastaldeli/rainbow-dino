import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Font, FontLoader } from 'three/addons/Addons.js';

import { GameState } from '../game-state';
import { Time } from '../time';
import { Tick } from '../tick';
import { AudioManager } from '../audio-manager';
import { Camera } from '../camera';

export class ScreenPauseMenu {
    private state: GameState;
    private time: Time;
    private tick: Tick;
    private lastTime: number = 0;
    private audioManager: AudioManager;

    private camera: Camera;

    private loader: FontLoader;
    private data?: any;

    //Material    
        private mesh!: THREE.Mesh;
        private material!: THREE.MeshBasicMaterial;
    
        private hasMessageShown: boolean = false;
        private messageInterval?: number | ReturnType<typeof setInterval>;
    
        private fadeState: 'in' | 'holding' | 'out' | 'none' = 'none';
        private fadeProgress: number = 0;
        private fadeDuration: number = 400;
        private showDuration: number = 600;
        private intervalDuration: number = 1500;
        private lastFadeTime: number = 0;
        private initInterval: number = 0;
    
        private colors = {
            //Day
            r_day: new THREE.Color('rgb(39, 39, 39)'),
    
            //Night
            r_night: new THREE.Color('rgb(122, 122, 122)'),
        }
    //

    constructor(
        state: GameState, 
        time: Time, 
        tick: Tick, 
        camera: Camera,
        audioManager: AudioManager
    ) {
        this.state = state;
        this.time = time;
        this.tick = tick;
        this.audioManager = audioManager;

        this.camera = camera;

        this.loader = new FontLoader();
        this.loadFont();
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

            await this.pausedText();
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    private async showMessage(): Promise<void> {
        if(this.fadeState === 'none') this.audioManager.playAudio('select');
        if(this.fadeState !== 'none') return;
    
        try {
            this.camera.camera.add(this.mesh);
            if(this.material) this.material.visible = true;
            this.hasMessageShown = true;
            this.fadeState = 'holding';

            setTimeout(() => {
                if(this.fadeState === 'holding') this.startFadeOut();
            }, this.showDuration);
        } catch(err) {
            console.log(err);
        }
    }

    public hideMessage(): void {
        if(this.messageInterval) {
            clearInterval(this.messageInterval);
            this.messageInterval = undefined;
        }

        if(this.material) this.material.visible = false;
        this.fadeState = 'none';
        this.fadeProgress = 0;
        this.hasMessageShown = false;
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
    
    private updateFade(internalTime: number): void {
        if(this.fadeState === 'none' || !this.mesh || !this.material) return;
            
        this.fadeProgress += internalTime * 1000;
        const normalizedProgress = Math.min(this.fadeProgress / this.fadeDuration, 1);
            
        if(this.fadeState === 'holding') {
            this.material.opacity = 0.6;
        } else if(this.fadeState === 'in') {
            this.material.opacity = THREE.MathUtils.lerp(0, 0.6, normalizedProgress);
            
            if(normalizedProgress >= 1) {
                this.fadeState = 'holding';

                setTimeout(() => {
                    if(this.fadeState === 'holding') this.startFadeOut();
                }, this.showDuration)
            }
        } else if(this.fadeState === 'out') {
            this.material.opacity = THREE.MathUtils.lerp(0.6, 0, normalizedProgress);
            
            if(normalizedProgress >= 1) {
                if(this.hasMessageShown) {
                    this.fadeState = 'in';
                    this.fadeProgress = 0;
                } else {
                    this.fadeState = 'none';
                    this.clearMessage();
                }
            }
        }
    }
            
    private clearMessage(): void {
        if(this.mesh) {
            this.mesh.geometry.dispose();
            if(this.mesh.material instanceof THREE.Material) this.mesh.geometry.dispose();
        }
    }
    
    private async pausedText(): Promise<THREE.Mesh> {
        try {
            const size = {
                s: 0.2,
                d: 0
            }
    
            const pos = {
                x: 0,
                y: 0,
                z: -2
            }
    
            const text = '"ESC" to resume';
    
            const geometry = new TextGeometry(text, {
                font: this.data,
                size: size.s,
                depth: size.d,
                bevelEnabled: false
            });
    
            geometry.center();
    
            if(!this.material) {
                this.material = new THREE.MeshBasicMaterial({ 
                    color: this.colors.r_day,
                    transparent: true,
                    opacity: 0.0,
                    visible: true
                });
            }
    
            this.mesh = new THREE.Mesh(geometry, this.material);
            this.mesh.visible = true;
            
            this.mesh.position.x = pos.x;
            this.mesh.position.y = pos.y;
            this.mesh.position.z = pos.z;

            return this.mesh;
        } catch(err) {
            console.log(err);
            throw err;
        }
    }


    public update(deltaTime: number): void {
        if(this.state.current !== 'paused' || !this.material || !this.time) return;

        const now = performance.now();
        const internalTime = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.1) : 0;
        this.lastTime = now;

        const timeFactor = this.time.getTimeFactor();

        const dayColor = this.colors.r_day
        const nightColor = this.colors.r_night

        this.material.color.lerpColors(
            nightColor,
            dayColor,
            timeFactor
        );

        this.material.needsUpdate = true;
        this.updateFade(internalTime);
    }

    public async ready(): Promise<void> {
        if(this.messageInterval) clearInterval(this.messageInterval);
        if(!this.mesh) await this.pausedText();
        await this.showMessage();
        this.messageInterval = setInterval(() => this.showMessage(), this.initInterval);
    }
}