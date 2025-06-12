import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Font, FontLoader, OBJLoader, MTLLoader } from 'three/addons/Addons.js';

import { GameState } from '../game-state.js';
import { Time } from '../time.js';
import { Tick } from '../tick.js';
import { Camera } from '../camera.js';
import { Score } from '../score.js';
import { Lightning } from '../lightning.js';

export class ScreenMainMenu {
    private state: GameState;
    private tick: Tick;
    private time: Time;
    private lastTime: number = 0;

    private camera: Camera;

    private lightning: Lightning;
    private ambientLightColor: THREE.Color;
    private ambientLightIntensity: number;
    private directionalLight: THREE.DirectionalLight;
    private directionalLightColor: THREE.Color;
    private directionalLightIntensity: number;
    private directionalLightPosition: THREE.Vector3;

    private score: Score;
    
    private fontLoader: FontLoader;
    private objLoader: OBJLoader;
    private mtlLoader: MTLLoader;
    private texLoader: THREE.TextureLoader;
    private data?: any;

    private isStarted: boolean = false;

    //Material
        private group: THREE.Group;

        private logoMesh!: THREE.Object3D;
        private logoMat!: THREE.ShaderMaterial;
        private logoTexArray: [] = [];

        private scoreMesh!: THREE.Mesh;
        private scoreMat!: THREE.MeshStandardMaterial[];
        
        //Start
            private startMesh!: THREE.Mesh;
            private startMat!: THREE.MeshStandardMaterial[];
         
            private hasMessageShown: boolean = false;
         
            private fadeState: 'in' | 'holding' | 'out' | 'none' = 'none';
            private fadeProgress: number = 0;
            private fadeDuration: number = 500;
            private showDuration: number = 800;
            private lastFadeTime: number = 0;
            private messageInterval?: number;
            private intervalDuration: number = 1500;
        //
         
        private colors = {
            //Day
            i_day_f: new THREE.Color('rgb(151, 151, 151)'),
            i_day_b: new THREE.Color('rgb(92, 92, 92)'),
            
            s_day_f: new THREE.Color('rgb(81, 81, 81)'),
            s_day_b: new THREE.Color('rgb(14, 14, 14)'),
         
            //Night
            i_night_f: new THREE.Color('rgb(255, 255, 255)'),
            i_night_b: new THREE.Color('rgb(137, 137, 137)'),

            s_night_f: new THREE.Color('rgb(232, 232, 232)'),
            s_night_b: new THREE.Color('rgb(160, 160, 160)'),

            //Selected
            selec_f: new THREE.Color('rgb(168, 202, 243)'),
            selec_b: new THREE.Color('rgb(49, 139, 250)')
        }
    //

    constructor(
        state: GameState, 
        tick: Tick, 
        time: Time, 
        camera: Camera,
        score: Score,
    ) {
        this.state = {
            current: 'menu',
            prev: null,
            tick: { timeScale: tick.getTimeScale() }
        }

        this.tick = tick;
        this.time = time;

        this.camera = camera;
        this.score = score;
        this.score.getHighScore();

        this.group = new THREE.Group();

        this.fontLoader = new FontLoader();
        this.objLoader = new OBJLoader();
        this.mtlLoader = new MTLLoader();

        this.texLoader = new THREE.TextureLoader();

        //Lightning
            this.lightning = new Lightning(this.tick, this.time);
        
            this.ambientLightColor = this.lightning.getColor();
            this.ambientLightIntensity = this.lightning.getAmbientLightIntensity();
        
            this.directionalLight = this.lightning.getDirectionalLight();
            this.directionalLightColor = this.lightning.getDirectionalLightColor();
            this.directionalLightIntensity = this.lightning.getDirectionalLightIntensity();
            this.directionalLightPosition = this.lightning.getDirectionalLightPos();
        //

        setInterval(() => this.showMessage(), this.intervalDuration);
    }

    private async loadFont(): Promise<void> {
        try {
            this.data = await new Promise((res, rej) => {
                const path = '../../assets/fonts/HomeVideoRegular.json';

                this.fontLoader.load(
                    path,
                    (font) => res(font),
                    undefined,
                    (err) => rej(err)
                );
            });

            await this.createStartText();
            await this.createHighScoreText();
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    private async createLogo(): Promise<THREE.Mesh> {
        const size = {
            w: 1,
            h: 1,
            d: 1
        }

        const pos = {
            x: 0,
            y: 0,
            z: -8
        }

        try {
            const [vertexShader, fragmentShader] = await Promise.all([
                this.loadShader('./screens/shaders/vertexShader.glsl'),
                this.loadShader('./screens/shaders/fragShader.glsl')
            ]);

            const mtlPath = '../../../assets/textures/logo.mtl'
            const materials = await this.mtlLoader.loadAsync(mtlPath);
            materials.preload();

            const path = '../../../assets/obj/logo.obj';
            const texPath = '../../../assets/textures/logo.png';
            const tex = await this.texLoader.loadAsync(texPath);
            tex.generateMipmaps = true;

            this.logoMat = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    timeFactor: { value: this.time.getTimeFactor() },
                    map: { value: tex },
                    scrollSpeed: { value: 0.8 },
                    letterCount: { value: 11.0 },
                    shadowMap: { value: null },
                    shadowBias: { value: 0.01 },
                    shadowRadius: { value: 1.0 },
                    ambientLightColor: { value: this.ambientLightColor },
                    ambientLightIntensity: { value: this.ambientLightIntensity },
                    directionalLightColor: { value: this.directionalLightColor },
                    directionalLightIntensity: { value: this.directionalLightIntensity },
                    directionalLightPosition: { value: this.directionalLightPosition },
                    directionalLightMatrix: { value: new THREE.Matrix4() },
                },
                vertexShader,
                fragmentShader,
                side: THREE.DoubleSide,
            });

            return new Promise<THREE.Mesh>((res, rej) => {
                this.objLoader
                    .setMaterials(materials)
                    .load(path, async (obj) => {
                    this.logoMesh = obj;
                    let logo: THREE.Mesh | undefined;

                    this.logoMesh.traverse((m) => {
                        if(m instanceof THREE.Mesh) {
                            const geometry = m.geometry;
                            const posAttribute = geometry.getAttribute('position');
                            m.material = this.logoMat;
                            m.castShadow = true;
                            m.receiveShadow = true;
                            logo = m;
                        }
                    });

                    if(!logo) throw new Error("err");


                    logo.scale.x = size.w;
                    logo.scale.y = size.h;
                    logo.scale.z = size.d;

                    logo.position.x = pos.x;
                    logo.position.y = pos.y;
                    logo.position.z = pos.z;

                    res(logo);
                }, undefined, rej);
            });
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    //Start Text
        private async showMessage(): Promise<void> {
            if(this.fadeState !== 'none') return;
        
            try {
                this.hasMessageShown = true;
                this.startFadeIn();
            } catch(err) {
                console.log(err);
            }
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
            if(this.fadeState === 'none' || !this.startMesh || !this.startMat) return;
                
            this.fadeProgress += internalTime * 1000;
            const normalizedProgress = Math.min(this.fadeProgress / this.fadeDuration, 1);
                
            if(this.fadeState === 'in') {
                const opacity = THREE.MathUtils.lerp(0.0, 1.0, normalizedProgress);

                this.startMat.forEach(mat => {
                    mat.opacity = opacity;
                    mat.transparent = opacity < 1.0;
                    mat.visible = opacity > 0;
                });
                
                if(normalizedProgress >= 1) {
                    this.fadeState = 'holding';
        
                    setTimeout(() => {
                        if(this.fadeState === 'holding') this.startFadeOut();
                    }, this.showDuration);
                }
            } else if(this.fadeState === 'out') {
                const opacity = THREE.MathUtils.lerp(1.0, 0.0, normalizedProgress);

                this.startMat.forEach(mat => {
                    mat.opacity = opacity;
                    mat.transparent = opacity < 1.0;
                    mat.visible = opacity > 0;
                });
                
                if(normalizedProgress >= 1) {
                    this.fadeState = 'none';
                    this.clearMessage();
                };
            }
        }

        public onStarted(): void {
            this.isStarted = true;
            this.fadeState = 'none';

            if(this.startMat) {
                this.startMat.forEach(mat => {
                    mat.opacity = 1.0;
                    mat.visible = false;
                    setInterval(() => mat.visible = !mat.visible, 100);
                });

                this.startMat[0].color = this.colors.selec_f.clone();
                this.startMat[1].color = this.colors.selec_b.clone();
    
                this.startMat[0].needsUpdate = true;
                this.startMat[1].needsUpdate = true;
            }
        }
                
        public clearMessage(): void {
            if(this.startMesh) {
                this.startMesh.geometry.dispose();
                
                if(Array.isArray(this.startMesh.material)) {
                    this.startMesh.material.forEach(mat => 
                        mat.dispose()
                    );
                }
            }
        }

        private async createStartText(): Promise<THREE.Mesh> {
            try {
                const size = {
                    s: 0.3,
                    d: 0.02
                }

                const pos = {
                    x: 0,
                    y: -1,
                    z: -3
                }

                const text = 'PRESS ANY KEY TO START';

                const geometry = new TextGeometry(text, {
                    font: this.data,
                    size: size.s,
                    depth: size.d,
                    bevelEnabled: false
                });

                geometry.center();

                if(!this.startMat) {
                    this.startMat = [
                        new THREE.MeshStandardMaterial({ 
                            color: this.colors.i_day_f, 
                            side: THREE.DoubleSide,
                            opacity: 0.0,
                        }),
                        new THREE.MeshStandardMaterial({ 
                            color: this.colors.i_day_b, 
                            side: THREE.DoubleSide,
                            opacity: 0.0,
                        }),
                    ];
                }

                this.startMesh = new THREE.Mesh(geometry, this.startMat);
                this.startMesh.receiveShadow = true;
                this.startMesh.castShadow = true;

                this.startMesh.position.x = pos.x;
                this.startMesh.position.y = pos.y;
                this.startMesh.position.z = pos.z;

                return this.startMesh;
            } catch(err) {
                console.log(err);
                throw err;
            }
        }
    //

    //Score
    private scoreInfo(): any {
        const size = {
            s: 0.5,
            d: 0.02
        }

        const pos = {
            x: 0,
            y: -4,
            z: -5
        }

        const highScore = this.score.getHighScore();
        const text = `SCORE - ${highScore.toString().padStart(7, '0')}`;

        return {
            size,
            pos,
            highScore,
            text
        }
    }

    private async createHighScoreText(): Promise<THREE.Mesh> {
        try {
            const info = this.scoreInfo();

            const geometry = new TextGeometry(info.text, {
                font: this.data,
                size: info.size.s,
                depth: info.size.d,
                bevelEnabled: false
            });

            geometry.center();

            if(!this.scoreMesh) {
                this.scoreMat = [
                    new THREE.MeshStandardMaterial({ 
                        color: this.colors.s_day_f, 
                        side: THREE.DoubleSide 
                    }),
                    new THREE.MeshStandardMaterial({ 
                        color: this.colors.s_day_b, 
                        side: THREE.DoubleSide
                    }),
                ];
            }

            this.scoreMesh = new THREE.Mesh(geometry, this.scoreMat);
            this.scoreMesh.receiveShadow = true;
            this.scoreMesh.castShadow = true;

            this.scoreMesh.position.x = info.pos.x;
            this.scoreMesh.position.y = info.pos.y;
            this.scoreMesh.position.z = info.pos.z;

            return this.scoreMesh;
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    public updateHighScore(): void {
        if(!this.scoreMesh || !this.data) return;

        const info = this.scoreInfo();

        const updGeometry = new TextGeometry(info.text, {
            font: this.data,
            size: info.size.s,
            depth: info.size.d,
            bevelEnabled: false
        });

        updGeometry.center();

        if(this.scoreMesh.geometry) this.scoreMesh.geometry.dispose();
        this.scoreMesh.geometry = updGeometry;
    }

    private async loadShader(url: string): Promise<string> {
        const res = await fetch(url);
        if(!res.ok) throw new Error(`Failed to load shader ${url}: ${res.statusText}`);
        return await res.text();
    }

    private async _menuGroup(): Promise<THREE.Group> {
        await Promise.all([
            this.createLogo(),
            this.showMessage(),
            this.createHighScoreText()
        ]);

        this.group.add(this.logoMesh);
        this.group.add(this.scoreMesh);
        this.group.add(this.startMesh);

        this.camera.camera.add(this.group);
        return this.group;
    }

    public async hideMenu(): Promise<void> {
        this.camera.camera.remove(this.group);
    }

    public update(deltaTime: number): void {
        if(!this.logoMesh || !this.scoreMat || !this.startMat) return;

        const now = performance.now();
        const factor = this.time.getTimeFactor();
        const totalTime = performance.now() * this.time['initSpeed'] * this.tick.getTimeScale();
        const timeFactor = this.time.getTimeFactor();
        const internalTime = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.1) : 0;
        const ambientColor = this.lightning.update(factor);
        this.lastTime = now;

        const fStartColor = this.colors.i_day_f.clone().lerp(this.colors.i_night_f, 1 - timeFactor);
        const bStartColor = this.colors.i_day_b.clone().lerp(this.colors.i_night_b, 1 - timeFactor);

        const fScoreColor = this.colors.s_day_f.clone().lerp(this.colors.s_night_f, 1 - timeFactor);
        const bScoreColor = this.colors.s_day_b.clone().lerp(this.colors.s_night_b, 1 - timeFactor);

        if(!this.isStarted && this.startMat && this.startMat.length >= 2) {
            this.startMat[0].color.copy(fStartColor);
            this.startMat[1].color.copy(bStartColor);

            this.startMat[0].needsUpdate = true;
            this.startMat[1].needsUpdate = true;

            this.updateFade(internalTime);
        }

        if(this.scoreMat && this.scoreMat.length >= 2) {
            this.scoreMat[0].color.copy(fScoreColor);
            this.scoreMat[1].color.copy(bScoreColor);

            this.scoreMat[0].needsUpdate = true;
            this.scoreMat[1].needsUpdate = true;
        }

       

        this.logoMat.uniforms.time.value = totalTime;
        this.logoMat.uniforms.timeFactor.value = factor;

        this.logoMat.uniforms.ambientLightColor.value = ambientColor;
        this.logoMat.uniforms.ambientLightIntensity.value = this.ambientLightIntensity;

        this.logoMat.uniforms.directionalLightColor.value = this.directionalLightColor;
        this.logoMat.uniforms.directionalLightIntensity.value = this.directionalLightIntensity;
        this.logoMat.uniforms.directionalLightPosition.value = this.directionalLightPosition;
        this.logoMat.uniforms.directionalLightMatrix.value = this.directionalLight.shadow.matrix;

        this.logoMat.needsUpdate = true;
    }

    public async ready(): Promise<THREE.Group> {
        await this.loadFont();
        await this.updateHighScore();
        return this._menuGroup();
    }
}