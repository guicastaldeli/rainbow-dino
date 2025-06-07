import * as THREE from 'three';
export class Lightning {
    constructor() {
        this.color = new THREE.Color('rgb(255, 255, 255)');
        this.intensity = 1.0;
        this.dlColor = new THREE.Color('rgb(0, 0, 0)');
        this.dlIntensity = 3.0;
        this.dlPosition = new THREE.Vector3(1, 1, 1);
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
        return this.directionalLight;
    }
    addLights() {
        this.addAmbientLight();
        this.addDirectionalLight();
        return [this.ambientLight, this.directionalLight];
    }
}
