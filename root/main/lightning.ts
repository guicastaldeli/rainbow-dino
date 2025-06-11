import * as THREE from 'three';

import { Tick } from './tick';
import { Time } from './time';

export class Lightning {
    private tick: Tick;
    private timeCycle: Time;

    //Ambient Light
        private ambientLight!: THREE.AmbientLight;

        private readonly colors = {
            night: new THREE.Color('rgb(120, 120, 120)'),
            day: new THREE.Color('rgb(203, 203, 203)'),
        }

        private color: THREE.Color = new THREE.Color();
        private intensity: number = 1.0;
    //
    
    //Directional Light
        private directionalLight!: THREE.DirectionalLight;
        private dlColor: THREE.Color = new THREE.Color('rgb(255, 255, 255)');
        private dlIntensity: number = 0.5;
        private directionalLightHelper!: THREE.DirectionalLightHelper;

        private pos = {
            x: 4, 
            y: 5, 
            z: 5
        }

        private dlPosition: THREE.Vector3 = new THREE.Vector3(this.pos.x, this.pos.y, this.pos.z);
    //

    constructor(tick: Tick, timeCycle: Time) {
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.color = this.initColorTimeFactor();
        this.addLights();
    }

    private initColorTimeFactor(): THREE.Color {
        const timeFactor = this.timeCycle.getTimeFactor();
        const blendColor = this.smoothstep(0.3, 0.7, timeFactor);
        return this.mixColors(this.colors.night, this.colors.day, blendColor);
    }

    public addAmbientLight(): THREE.AmbientLight {
        this.ambientLight = new THREE.AmbientLight(this.color, this.intensity);
        return this.ambientLight;
    }

    public addDirectionalLight(): THREE.DirectionalLight {
        this.directionalLight = new THREE.DirectionalLight(this.dlColor, this.dlIntensity);
        this.directionalLight.position.copy(this.dlPosition);
        this.directionalLight.castShadow = true;
        this.directionalLightHelper = new THREE.DirectionalLightHelper(this.directionalLight, 1);
        return this.directionalLight;
    }

    public getLightHelper(): THREE.DirectionalLightHelper {
        return this.directionalLightHelper;
    }

    public updateLightHelper(): void {
        if (this.directionalLightHelper) {
            this.directionalLightHelper.update();
        }
    }

    //Lights
        public getAmbientLightIntensity(): number {
            return this.intensity;
        }

        public getDirectionalLight(): THREE.DirectionalLight {
            return this.directionalLight;
        }

        public getDirectionalLightColor(): THREE.Color {
            return this.dlColor;
        }

        public getDirectionalLightIntensity(): number {
            return this.dlIntensity;
        }

        public getDirectionalLightPos(): THREE.Vector3 {
            return this.dlPosition;
        }
    //

    public addLights(): THREE.Light[] {
        this.addAmbientLight();
        this.addDirectionalLight();

        return [this.ambientLight, this.directionalLight];
    }

    public getColor(): THREE.Color {
        return this.initColorTimeFactor();
    }

    private mixColors(fColor: THREE.Color, sColor: THREE.Color, factor: number): THREE.Color {
        const res = new THREE.Color();
        res.r = fColor.r + (sColor.r - fColor.r) * factor;
        res.g = fColor.g + (sColor.g - fColor.g) * factor;
        res.b = fColor.b + (sColor.b - fColor.b) * factor;
        return res;
    }

    private smoothstep(min: number, max: number, value: number): number {
        const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return x * x * (3 - 2 * x);
    }

    public resetState(): void {
        this.color = this.initColorTimeFactor();

        if(this.ambientLight) {
            this.ambientLight.color.copy(this.color);
            this.ambientLight.intensity = this.intensity;
        }

        if(this.directionalLight) {
            this.directionalLight.color.copy(this.dlColor);
            this.directionalLight.intensity = this.dlIntensity;
            this.directionalLight.position.set(this.pos.x, this.pos.y, this.pos.z);
        }
    }

    public update(deltaTime: number): THREE.Color {
        if(!deltaTime) return this.color;

        const timeFactor = this.timeCycle.getTimeFactor();
        const blendFactor = this.smoothstep(0.3, 0.7, timeFactor);

        this.color = this.mixColors(this.colors.night, this.colors.day, blendFactor);
        this.ambientLight.color.copy(this.color);

        return this.color;
    }
}