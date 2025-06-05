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
        this.size = {
            s: 0.5,
            d: 0.2
        };
        this.pos = {
            x: -3,
            y: 0,
            z: -4
        };
        this.time = time;
        this.loader = new FontLoader();
        this.loadFont();
        this.value = 0;
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
        if (!this.data)
            return;
        const text = this.value.toString();
        const geometry = new TextGeometry(text, {
            font: this.data,
            size: this.size.s,
            depth: this.size.d,
            bevelEnabled: false,
        });
        const material = new THREE.MeshBasicMaterial({ color: 'rgb(255, 0, 174)' });
        if (!this.mesh) {
            this.mesh = new THREE.Mesh(geometry, material);
        }
        else {
            this.mesh.geometry = geometry;
            this.mesh.material = material;
        }
        this.mesh.position.x = this.pos.x;
        this.mesh.position.y = this.pos.y;
        this.mesh.position.z = this.pos.z;
    }
    getScore() {
        if (!this.mesh)
            throw new Error('mesh err');
        return this.mesh;
    }
    update() {
        if (!this.mesh || !this.data)
            return;
        const updScore = Math.floor(this.time.updateSpeed() * 1000) / 1000;
        if (updScore === this.value)
            return;
        this.value = updScore;
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
