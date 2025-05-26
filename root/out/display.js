import * as THREE from 'three';
import { Terrain } from './terrain.js';
export class Display {
    constructor() {
        this.size = {
            w: window.innerWidth / 80,
            h: window.innerHeight / 65,
            d: 0.1
        };
        this.pos = {
            x: 0,
            y: 0,
            z: -3
        };
        this.display = this.setDisplay();
    }
    createDisplay() {
        const geometry = new THREE.BoxGeometry(this.size.w, this.size.h, this.size.d);
        const edges = new THREE.EdgesGeometry(geometry);
        this.mesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 'rgb(173, 42, 42)' }));
        return this.mesh;
    }
    displayPos() {
        this.mesh.position.x = this.pos.x,
            this.mesh.position.y = this.pos.y,
            this.mesh.position.z = this.pos.z;
    }
    _mainGroup() {
        const mainGroup = new THREE.Group();
        mainGroup.add(this.mesh);
        //Render
        //Terrain
        const renderTerrain = new Terrain();
        mainGroup.add(renderTerrain.mesh);
        //
        return mainGroup;
    }
    setDisplay() {
        this.createDisplay();
        this.displayPos();
        return this._mainGroup();
    }
}
