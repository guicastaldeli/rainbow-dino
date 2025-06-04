var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/Addons.js';
export class Score {
    constructor(time) {
        this.time = time;
        this.text = 0;
        this.loader = new FontLoader();
        this.loadFont();
    }
    loadFont() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.data = yield new Promise((res, rej) => {
                    const path = '../../assets/font/CascadiaCodeRegular.json';
                    this.loader.load(path, (font) => res(font), undefined, (err) => rej(err));
                });
                this.createScore();
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
    createScore() {
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
        if (this.mesh) {
            this.mesh.geometry = geometry;
            this.mesh.position.x = 0;
            this.mesh.position.y = 0;
            this.mesh.position.z = -3;
        }
    }
    getScore() {
        if (!this.mesh)
            throw new Error('mesh err');
        return this.mesh;
    }
    update() {
        this.text = this.time.updateSpeed();
        this.createScore();
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                while (!this.mesh)
                    yield new Promise(res => setTimeout(res, 100));
                return this.getScore();
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
}
