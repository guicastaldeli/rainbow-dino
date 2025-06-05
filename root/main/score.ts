import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/Addons.js';

import { Time } from "./time";

export class Score {
    private time: Time;

    private loader: FontLoader;
    private mesh!: THREE.Mesh;
    private data?: any;
    
    private value: number;

    constructor(time: Time) {
        this.time = time;

        this.loader = new FontLoader();
        this.loadFont();

        this.value = 0;
    }

    size = {
        s: 0.5,
        d: 0.2 
    }

    pos = {
        x: -3,
        y: 0,
        z: -4
    }

    private async loadFont(): Promise<void> {
        try {
            this.data = await new Promise((res, rej) => {
                const path = '../../assets/font/CascadiaCodeRegular.json';

                this.loader.load(
                    path, 
                    (font) => res(font),
                    undefined,
                    (err) => rej(err)
                );
            });

            this.createScore();
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    private createScore(): void {
        if(!this.data) return;

        const text = this.value.toString();

        const geometry = new TextGeometry(text, {
            font: this.data,
            size: this.size.s,
            depth: this.size.d,
            bevelEnabled: false,
        });

        const material = new THREE.MeshBasicMaterial({ color: 'rgb(255, 0, 174)' });

        if(!this.mesh) {
            this.mesh = new THREE.Mesh(geometry, material);
        } else {
            this.mesh.geometry = geometry;
            this.mesh.material = material;
        }

        this.mesh.position.x = this.pos.x;
        this.mesh.position.y = this.pos.y;
        this.mesh.position.z = this.pos.z;
    }

    
    public getScore(): THREE.Mesh {
        if(!this.mesh) throw new Error('mesh err');
        return this.mesh;
    }

    public update(): void {
        if(!this.mesh || !this.data) return;

        const updScore = Math.floor(this.time.updateSpeed() * 1000) / 1000;
        if(updScore === this.value) return;

        this.value = updScore;
        this.createScore();
    }

    public async ready(): Promise<THREE.Mesh> {
        try {
            while(!this.mesh) await new Promise(res => setTimeout(res, 100));
            return this.getScore();
        } catch(err) {
            console.log(err);
            throw err;
        }
    }
}