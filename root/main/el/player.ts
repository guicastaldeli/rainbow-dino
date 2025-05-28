import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/Addons.js';

export class Player {
    private loader!: OBJLoader;
    private mtlLoader!: MTLLoader;
    private mesh!: THREE.Object3D;

    pos = {
        x: 0,
        y: 0,
        z: 0
    }

    constructor() {
        this.loader = new OBJLoader();
        this.mtlLoader = new MTLLoader();

        this.loadPlayer();
    }
    
    private loadPlayer() {
        const path = '../../../assets/obj/cube-test.obj';
        const tex = '../../../assets/textures/cube-test.mtl';

        this.mtlLoader.load(tex, (mat) => {
            mat.preload();
            this.loader.setMaterials(mat);

            this.loader.load(path, (obj) => {
                this.mesh = obj;
    
                this.mesh.position.x = this.pos.x;
                this.mesh.position.y = this.pos.y;
                this.mesh.position.z = this.pos.z;
            });
        });
    }

    public ready(): Promise<THREE.Object3D> {
        return new Promise((res, rej) => {
            const checkLoaded = () => {
                if(this.mesh) {
                    res(this.mesh);
                } else {
                    setTimeout(checkLoaded, 100);
                }
            }

            checkLoaded();
        });
    }
}