import * as THREE from 'three';
export class Lightning {
    //
    constructor(tick, timeCycle) {
        this.colors = {
            night: new THREE.Color('rgb(177, 56, 56)'),
            dusk: new THREE.Color('rgb(204, 190, 128)'),
            day: new THREE.Color('rgb(203, 203, 203)'),
            dawn: new THREE.Color('rgb(204, 190, 128)')
        };
        this.color = this.colors.day;
        this.intensity = 1.0;
        this.dlColor = new THREE.Color('rgb(255, 255, 255)');
        this.dlIntensity = 0.5;
        this.pos = {
            x: 4,
            y: 5,
            z: 5
        };
        this.dlPosition = new THREE.Vector3(this.pos.x, this.pos.y, this.pos.z);
        this.tick = tick;
        this.timeCycle = timeCycle;
        this.addLights();
    }
    addAmbientLight() {
        this.ambientLight = new THREE.AmbientLight(this.color, this.intensity);
        return this.ambientLight;
    }
    addDirectionalLight() {
        this.directionalLight = new THREE.DirectionalLight(this.dlColor, this.dlIntensity);
        this.directionalLight.position.copy(this.dlPosition);
        this.directionalLight.castShadow = true;
        this.directionalLightHelper = new THREE.DirectionalLightHelper(this.directionalLight, 1);
        return this.directionalLight;
    }
    getLightHelper() {
        return this.directionalLightHelper;
    }
    updateLightHelper() {
        if (this.directionalLightHelper) {
            this.directionalLightHelper.update();
        }
    }
    addLights() {
        this.addAmbientLight();
        this.addDirectionalLight();
        return [this.ambientLight, this.directionalLight];
    }
    getColor() {
        return this.colors.night;
    }
    update(deltaTime) {
        if (!deltaTime)
            return this.color;
        const targetColor = () => {
            if (this.timeCycle.currentTimeCycle.night)
                return this.colors.night;
            if (this.timeCycle.currentTimeCycle.dawn)
                return this.colors.dawn;
            if (this.timeCycle.currentTimeCycle.day)
                return this.colors.day;
            if (this.timeCycle.currentTimeCycle.dusk)
                return this.colors.dusk;
            return this.colors.night;
        };
        const updateColor = this.timeCycle['initSpeed'] * deltaTime * this.tick.getTimeScale();
        this.color.lerp(targetColor(), Math.min(updateColor, 1));
        this.ambientLight.color.copy(this.color);
        return this.color;
    }
}
