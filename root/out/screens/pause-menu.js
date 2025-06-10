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
export class ScreenPauseMenu {
    //
    constructor(state, time, tick, camera) {
        this.lastTime = 0;
        this.hasMessageShown = false;
        this.fadeState = 'none';
        this.fadeProgress = 0;
        this.fadeDuration = 500;
        this.showDuration = 800;
        this.lastFadeTime = 0;
        this.initInterval = 0;
        this.intervalDuration = 1500;
        this.colors = {
            //Day
            r_day: new THREE.Color('rgb(39, 39, 39)'),
            //Night
            r_night: new THREE.Color('rgb(122, 122, 122)'),
        };
        this.state = state;
        this.time = time;
        this.tick = tick;
        this.camera = camera;
        this.loader = new FontLoader();
        this.loadFont();
    }
    loadFont() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.data = yield new Promise((res, rej) => {
                    const path = '../../assets/fonts/HomeVideoRegular.json';
                    this.loader.load(path, (font) => res(font), undefined, (err) => rej(err));
                });
                yield this.pausedText();
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
    showMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.fadeState !== 'none')
                return;
            try {
                this.camera.camera.add(this.mesh);
                this.hasMessageShown = true;
                this.startFadeIn();
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    hideMessage() {
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
            this.messageInterval = undefined;
        }
        if (this.material)
            this.material.visible = false;
        this.fadeState = 'none';
        this.fadeProgress = 0;
        this.hasMessageShown = false;
    }
    startFadeIn() {
        this.fadeState = 'in';
        this.fadeProgress = 0;
        this.lastFadeTime = performance.now();
    }
    startFadeOut() {
        this.fadeState = 'out';
        this.fadeProgress = 0;
        this.lastFadeTime = performance.now();
    }
    updateFade(internalTime) {
        if (this.fadeState === 'none' || !this.mesh || !this.material)
            return;
        this.fadeProgress += internalTime * 1000;
        const normalizedProgress = Math.min(this.fadeProgress / this.fadeDuration, 1);
        if (this.fadeState === 'in') {
            this.material.opacity = THREE.MathUtils.lerp(0, 0.6, normalizedProgress);
            if (normalizedProgress >= 1) {
                setTimeout(() => this.startFadeOut(), this.showDuration);
            }
        }
        else if (this.fadeState === 'out') {
            this.material.opacity = THREE.MathUtils.lerp(0.6, 0, normalizedProgress);
            if (normalizedProgress >= 1) {
                this.fadeState = 'none';
                this.clearMessage();
            }
        }
    }
    clearMessage() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            if (this.mesh.material instanceof THREE.Material)
                this.mesh.geometry.dispose();
        }
    }
    pausedText() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const size = {
                    s: 0.2,
                    d: 0
                };
                const pos = {
                    x: 0,
                    y: 0,
                    z: -2
                };
                const text = '"ESC" to resume';
                const geometry = new TextGeometry(text, {
                    font: this.data,
                    size: size.s,
                    depth: size.d,
                    bevelEnabled: false
                });
                geometry.center();
                if (!this.material) {
                    this.material = new THREE.MeshBasicMaterial({
                        color: this.colors.r_day,
                        transparent: true,
                        opacity: 0.0,
                        visible: true
                    });
                }
                this.mesh = new THREE.Mesh(geometry, this.material);
                this.mesh.position.x = pos.x;
                this.mesh.position.y = pos.y;
                this.mesh.position.z = pos.z;
                return this.mesh;
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
    update(deltaTime) {
        if (this.state.current !== 'paused' || !this.material || !this.time)
            return;
        const now = performance.now();
        const internalTime = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.1) : 0;
        this.lastTime = now;
        const timeFactor = this.time.getTimeFactor();
        const dayColor = this.colors.r_day;
        const nightColor = this.colors.r_night;
        this.material.color.lerpColors(nightColor, dayColor, timeFactor);
        this.material.needsUpdate = true;
        this.updateFade(internalTime);
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.messageInterval)
                clearInterval(this.messageInterval);
            if (!this.mesh)
                yield this.pausedText();
            yield this.showMessage();
            this.messageInterval = setInterval(() => this.showMessage(), this.initInterval);
        });
    }
}
