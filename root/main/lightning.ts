import * as THREE from 'three';

export class Lightning {
    //Ambient Light
        private ambientLight!: THREE.AmbientLight;
        private color: THREE.Color = new THREE.Color('rgb(73, 73, 73)');
        private intensity: number = 1.0;
    //
    
    //Directional Light
        private directionalLight!: THREE.DirectionalLight;
        private dlColor: THREE.Color = new THREE.Color('rgb(255, 255, 255)');
        private dlIntensity: number = 1.3;
        private directionalLightHelper!: THREE.DirectionalLightHelper;

        private pos = {
            x: 8, 
            y: 15, 
            z: 5
        }

        private dlPosition: THREE.Vector3 = new THREE.Vector3(this.pos.x, this.pos.y, this.pos.z);
    //

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
}