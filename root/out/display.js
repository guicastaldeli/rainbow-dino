import * as THREE from 'three';
import { Time } from './time.js';
import { Terrain } from './el/terrain.js';
import { Player } from './el/player.js';
export class Display {
    constructor() {
        this.timeCycle = new Time();
        this.size = {
            w: 13,
            h: 8,
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
        this.mainGroup = new THREE.Group();
        this.mainGroup.add(this.mesh);
        //Render
        //Terrain
        const renderTerrain = new Terrain();
        this.mainGroup.add(renderTerrain.mesh);
        //Player
        const renderPlayer = new Player(this.timeCycle);
        renderPlayer.ready().then(obj => {
            //renderPlayer.update();
            this.mainGroup.add(obj);
        }).catch(err => {
            console.log(err);
        });
        //
        return this.mainGroup;
    }
    setDisplay() {
        this.createDisplay();
        this.displayPos();
        return this._mainGroup();
    }
    //Resize
    handleResize() {
        this.size.w = this.size.w;
        this.size.h = this.size.h;
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
}
