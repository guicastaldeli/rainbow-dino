import * as THREE from 'three';

export class Lightning {
    private ambientLight!: THREE.AmbientLight;
    private color: THREE.Color = new THREE.Color('rgb(255, 255, 255)');
    private intensity: number = 1.0;
    
    private directionalLight!: THREE.DirectionalLight;
    private dlColor: THREE.Color = new THREE.Color('rgb(0, 0, 0)');
    private dlIntensity: number = 3.0;
    private dlPosition: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

    constructor() {
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
        return this.directionalLight;
    }

    public addLights(): THREE.Light[] {
        this.addAmbientLight();
        this.addDirectionalLight();

        return [this.ambientLight, this.directionalLight];
    }
}