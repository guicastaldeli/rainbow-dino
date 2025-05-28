import * as THREE from 'three';

import { Time } from './time.js';
import { Terrain } from './el/terrain.js';
import { Player } from './el/player.js';

export class Display {
    private timeCycle: Time;

    public display: any;
    public mainGroup!: THREE.Group;
    private mesh!: THREE.LineSegments;

    private renderPlayer!: Player;

    constructor(timeCycle: Time) {
        this.timeCycle = timeCycle;
        this.display = this.setDisplay();
    }

    size = {
        w: 13,
        h: 8,
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
        this.mainGroup = new THREE.Group();
        this.mainGroup.add(this.mesh);

        //Render
            //Terrain
            const renderTerrain = new Terrain();
            this.mainGroup.add(renderTerrain.mesh);

            //Player
            this.renderPlayer = new Player(this.timeCycle);

            this.renderPlayer.ready().then(obj => {
                this.mainGroup.add(obj);
            }).catch(err => {
                console.log(err);
            });
        //

        return this.mainGroup;
    }

    public setDisplay(): THREE.Group {
        this.createDisplay();
        this.displayPos();

        return this._mainGroup();
    }

    public update(deltaTime: number) {
        if(this.renderPlayer) this.renderPlayer.update(deltaTime);
    }

    //Resize
        private handleResize(): void {
            this.size.w = this.size.w;
            this.size.h = this.size.h;

            window.addEventListener('resize', () => {
                this.handleResize();
            });
        }
    //
}