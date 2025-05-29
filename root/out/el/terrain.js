import * as THREE from 'three';
export class Terrain {
    constructor() {
        this.blocks = [];
        this.count = 5;
        this.speed = 0.01;
        this.length = 5;
        this.size = {
            w: 1,
            h: 1,
            d: 0.1
        };
        this.pos = {
            x: 0,
            y: 0,
            z: -3
        };
        this.setTerrain();
    }
    createTerrain(x) {
        const geometry = new THREE.BoxGeometry(this.size.w, this.size.h, this.size.d);
        const material = new THREE.MeshBasicMaterial({ color: 'rgb(28, 205, 54)' });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.x = x * 2;
        this.mesh.position.y = this.pos.y;
        this.mesh.position.z = this.pos.z;
        return this.mesh;
    }
    setTerrain() {
        for (let i = 0; i < this.count; i++) {
            const x = i * this.size.w;
            const block = this.createTerrain(x);
            this.blocks.push(block);
        }
    }
    getTerrainBlocks() {
        return this.blocks;
    }
    update() {
        for (const b of this.blocks)
            b.position.z += this.speed;
        const fBlock = this.blocks[0];
        if (fBlock.position.z > this.length) {
            this.blocks.shift[0];
            const lBlock = this.blocks[this.blocks.length - 1];
            const updZ = lBlock.position.z + this.length;
            const updBlock = this.createTerrain(updZ);
            this.blocks.push(updBlock);
        }
    }
}
