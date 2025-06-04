import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/Addons.js';

import { Time } from "./time";

export class Score {
    private time: Time;

    private loader: FontLoader;
    private data?: any;
    private text: number;
    private mesh?: THREE.Mesh;

    constructor(time: Time) {
        this.time = time;

        this.text = 0;
        this.loader = new FontLoader();
        this.loadFont();
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
        const textString = this.text.toString();

        const geometry = new TextGeometry(textString, {
            font: this.data,
            size: 1,
            depth: 0.2,
            curveSegments: 4,
            bevelEnabled: false,
        });

        const meshGeometry = new THREE.BufferGeometry();
        const meshMat = new THREE.MeshBasicMaterial({ color: 'rgb(255, 0, 174)' });
        this.mesh = new THREE.Mesh(meshGeometry, meshMat);

        if(this.mesh) {
            this.mesh.geometry = geometry;
            this.mesh.position.x = 0;
            this.mesh.position.y = 0;
            this.mesh.position.z = -3;
        }
    }

    public getScore(): THREE.Mesh {
        if(!this.mesh) throw new Error('mesh err');
        return this.mesh;
    }

    public update(): void {
        this.text = this.time.updateSpeed();
        this.createScore();
    }

    public async ready(): Promise<THREE.Mesh> {
        try {
            while(!this.mesh) await new Promise(res => setTimeout(res, 100));
            return this.getScore();
        } catch(err) {
            console.log(err);
            throw err
        }
    }
}