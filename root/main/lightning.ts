import * as THREE from 'three';

import { Tick } from './tick';
import { Time } from './time';

export class Lightning {
    private tick: Tick;
    private timeCycle: Time;

    //Ambient Light
        private ambientLight!: THREE.AmbientLight;

        colors = {
            night: new THREE.Color('rgb(177, 56, 56)'),
            dusk: new THREE.Color('rgb(204, 190, 128)'),
            day: new THREE.Color('rgb(203, 203, 203)'),
            dawn: new THREE.Color('rgb(204, 190, 128)')
        }

        private color: THREE.Color = this.colors.day;

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
        this.addLights();
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

    public addLights(): THREE.Light[] {
        this.addAmbientLight();
        this.addDirectionalLight();

        return [this.ambientLight, this.directionalLight];
    }

    public getColor(): THREE.Color {
        return this.colors.night;
    }

    public update(deltaTime: number): THREE.Color {
        if(!deltaTime) return this.color;

        const targetColor = (): THREE.Color => {
            if(this.timeCycle.currentTimeCycle.night) return this.colors.night;
            if(this.timeCycle.currentTimeCycle.dawn) return this.colors.dawn;
            if(this.timeCycle.currentTimeCycle.day) return this.colors.day;
            if(this.timeCycle.currentTimeCycle.dusk) return this.colors.dusk;
            return this.colors.night;
        } 

        const updateColor = this.timeCycle['initSpeed'] * deltaTime * this.tick.getTimeScale();
        this.color.lerp(targetColor(), Math.min(updateColor, 1));
        this.ambientLight.color.copy(this.color);

        return this.color;
    }
}