import * as THREE from 'three';
export class Lightning {
    //
    constructor(tick, timeCycle) {
        this.colors = {
            night: new THREE.Color('rgb(120, 120, 120)'),
            day: new THREE.Color('rgb(203, 203, 203)'),
        };
        this.color = new THREE.Color();
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
    mixColors(fColor, sColor, factor) {
        const res = new THREE.Color();
        res.r = fColor.r + (sColor.r - fColor.r) * factor;
        res.g = fColor.g + (sColor.g - fColor.g) * factor;
        res.b = fColor.b + (sColor.b - fColor.b) * factor;
        return res;
    }
    smoothstep(min, max, value) {
        const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return x * x * (3 - 2 * x);
    }
    update(deltaTime) {
        if (!deltaTime)
            return this.color;
        const timeFactor = this.timeCycle.getTimeFactor();
        const blendFactor = this.smoothstep(0.3, 0.7, timeFactor);
        this.color = this.mixColors(this.colors.night, this.colors.day, blendFactor);
        this.ambientLight.color.copy(this.color);
        return this.color;
    }
}
