import * as THREE from 'three';

export class Terrain {
    public mesh!: THREE.Mesh;

    constructor() {
        this.updateTerrain();
    }

    size = {
        w: 5,
        h: 1,
        d: 0.1 
    }

    pos = {
        x: 0,
        y: 0,
        z: -3
    }

    private createTerrain(): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(this.size.w, this.size.h, this.size.d);
        const material = new THREE.MeshBasicMaterial({ color: 'rgb(28, 205, 54)' });
        this.mesh = new THREE.Mesh(geometry, material);

        return this.mesh;
    }

    private terrainPos(): void {
        this.mesh.position.x = this.pos.x;
        this.mesh.position.y = this.pos.y;
        this.mesh.position.z = this.pos.z;
    }

    public updateTerrain(): void {
        this.createTerrain();
        this.terrainPos();
    } 
}