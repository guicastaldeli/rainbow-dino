import * as THREE from 'three';
export class Terrain {
    constructor() {
        this.size = {
            w: 5,
            h: 1,
            d: 0.1
        };
        this.pos = {
            x: 0,
            y: 0,
            z: -3
        };
        this.updateTerrain();
    }
    createTerrain() {
        const geometry = new THREE.BoxGeometry(this.size.w, this.size.h, this.size.d);
        const material = new THREE.MeshBasicMaterial({ color: 'rgb(28, 205, 54)' });
        this.mesh = new THREE.Mesh(geometry, material);
        return this.mesh;
    }
    terrainPos() {
        this.mesh.position.x = this.pos.x;
        this.mesh.position.y = this.pos.y;
        this.mesh.position.z = this.pos.z;
    }
    updateTerrain() {
        this.createTerrain();
        this.terrainPos();
    }
}
