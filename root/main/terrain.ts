import * as THREE from 'three';

export class Terrain {
    size = {
        w: 1,
        h: 5,
        d: 1 
    }

    pos = {
        x: 0,
        y: 0,
        z: -5
    }

    public createTerrain(): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(this.size.w, this.size.h, this.size.d);
        const material = new THREE.MeshBasicMaterial({ color: 'rgb(28, 205, 54)' });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.x = this.pos.x;
        mesh.position.y = this.pos.y;
        mesh.position.z = this.pos.z;

        return mesh;
    }
}