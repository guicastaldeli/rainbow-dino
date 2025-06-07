import * as THREE from 'three';
export class Lightning {
    //
    constructor() {
        this.color = new THREE.Color('rgb(73, 73, 73)');
        this.intensity = 1.0;
        this.dlColor = new THREE.Color('rgb(255, 255, 255)');
        this.dlIntensity = 1.3;
        this.pos = {
            x: 12,
            y: 15,
            z: 5
        };
        this.dlPosition = new THREE.Vector3(this.pos.x, this.pos.y, this.pos.z);
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
}
