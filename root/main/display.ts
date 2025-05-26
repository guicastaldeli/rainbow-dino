import * as THREE from 'three';

import { Terrain } from './terrain.js';

export class Display {
    public display: any;
    private mesh!: THREE.LineSegments;

    constructor() {
        this.display = this.setDisplay();
    }

    size = {
        w: window.innerWidth / 80,
        h: window.innerHeight / 65,
        d: 0.1
    }

    pos = {
        x: 0,
        y: 0,
        z: -3
    }

    private createDisplay(): THREE.LineSegments {
        const geometry = new THREE.BoxGeometry(this.size.w, this.size.h, this.size.d);
        const edges = new THREE.EdgesGeometry(geometry);
        this.mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 'rgb(173, 42, 42)' }));

        return this.mesh;
    }

    private displayPos(): void {
        this.mesh.position.x = this.pos.x,
        this.mesh.position.y = this.pos.y,
        this.mesh.position.z = this.pos.z;
    }

    private _mainGroup(): THREE.Group {
        const mainGroup = new THREE.Group();
        mainGroup.add(this.mesh);

        //Render
            //Terrain
            const renderTerrain = new Terrain();
            mainGroup.add(renderTerrain.mesh);
        //

        return mainGroup;
    }

    public setDisplay(): THREE.Group {
        this.createDisplay();
        this.displayPos();

        return this._mainGroup();
    }
}