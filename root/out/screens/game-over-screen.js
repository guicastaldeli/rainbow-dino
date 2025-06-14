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
export class ScreenGameOver {
    //
    constructor(state, tick, time, score, camera, player) {
        this.lastTime = 0;
        this.isReseted = false;
        this.hasMessageShown = false;
        this.fadeState = 'none';
        this.fadeProgress = 0;
        this.fadeDuration = 500;
        this.showDuration = 800;
        this.lastFadeTime = 0;
        this.intervalDuration = 1500;
        //
        this.colors = {
            //Day
            t_day: new THREE.Color('rgb(74, 74, 74)'),
            s_day: new THREE.Color('rgb(49, 49, 49)'),
            r_day: new THREE.Color('rgb(39, 39, 39)'),
            //Night
            t_night: new THREE.Color('rgb(173, 173, 173)'),
            s_night: new THREE.Color('rgb(140, 140, 140)'),
            r_night: new THREE.Color('rgb(122, 122, 122)'),
            //Selected
            selec: new THREE.Color('rgb(0, 64, 143)')
        };
        this.state = {
            current: 'game-over',
            prev: null,
            tick: { timeScale: tick.getTimeScale() }
        };
        this.time = time;
        this.tick = tick;
        this.score = score;
        this.camera = camera;
        this.player = player;
        this.group = new THREE.Group();
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
                yield this.createGameOverText();
                yield this.createGameOverScore();
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
    //Text
    createGameOverText() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const size = {
                    s: 0.25,
                    d: 0
                };
                const pos = {
                    x: 0,
                    y: 0.1,
                    z: -2
                };
                const text = 'GAME OVER';
                const geometry = new TextGeometry(text, {
                    font: this.data,
                    size: size.s,
                    depth: size.d,
                    bevelEnabled: false
                });
                geometry.center();
                if (!this.gameOverScoreMat)
                    this.gameOverTextMat = new THREE.MeshBasicMaterial({ color: this.colors.t_day });
                const mesh = new THREE.Mesh(geometry, this.gameOverTextMat);
                mesh.position.x = pos.x;
                mesh.position.y = pos.y;
                mesh.position.z = pos.z;
                return mesh;
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
    //Score
    createGameOverScore() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const size = {
                    s: 0.2,
                    d: 0
                };
                const pos = {
                    x: 0,
                    y: -0.25,
                    z: -2
                };
                const text = `SCORE:${this.score.getFinalScore().toString()}`;
                const geometry = new TextGeometry(text, {
                    font: this.data,
                    size: size.s,
                    depth: size.d,
                    bevelEnabled: false
                });
                geometry.center();
                if (!this.gameOverScoreMat)
                    this.gameOverScoreMat = new THREE.MeshBasicMaterial({ color: this.colors.s_day });
                const mesh = new THREE.Mesh(geometry, this.gameOverScoreMat);
                mesh.position.x = pos.x;
                mesh.position.y = pos.y;
                mesh.position.z = pos.z;
                return mesh;
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
    //Reset        
    showMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.fadeState !== 'none')
                return;
            try {
                this.hasMessageShown = true;
                this.startFadeIn();
            }
            catch (err) {
                console.log(err);
            }
        });
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
        if (this.fadeState === 'none' || !this.resetMesh || !this.resetMat)
            return;
        this.fadeProgress += internalTime * 1000;
        const normalizedProgress = Math.min(this.fadeProgress / this.fadeDuration, 1);
        if (this.fadeState === 'in') {
            this.resetMat.opacity = THREE.MathUtils.lerp(0, 0.6, normalizedProgress);
            if (normalizedProgress >= 1) {
                this.fadeState = 'holding';
                setTimeout(() => {
                    if (this.fadeState === 'holding')
                        this.startFadeOut();
                }, this.showDuration);
            }
        }
        else if (this.fadeState === 'out') {
            this.resetMat.opacity = THREE.MathUtils.lerp(0.6, 0, normalizedProgress);
            if (normalizedProgress >= 1) {
                this.fadeState = 'none';
                this.clearMessage();
            }
        }
    }
    clearMessage() {
        if (this.resetMesh) {
            this.resetMesh.geometry.dispose();
            if (this.resetMesh.material instanceof THREE.Material)
                this.resetMesh.material.dispose();
        }
    }
    resetText() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const size = {
                    s: 0.15,
                    d: 0
                };
                const pos = {
                    x: 0,
                    y: -0.65,
                    z: -2
                };
                const text = '"ESC" to restart...';
                const geometry = new TextGeometry(text, {
                    font: this.data,
                    size: size.s,
                    depth: size.d,
                    bevelEnabled: false
                });
                geometry.center();
                if (!this.resetMat) {
                    this.resetMat = new THREE.MeshBasicMaterial({
                        color: this.colors.r_day,
                        transparent: true,
                        opacity: 0.0
                    });
                }
                this.resetMesh = new THREE.Mesh(geometry, this.resetMat);
                this.resetMesh.position.x = pos.x;
                this.resetMesh.position.y = pos.y;
                this.resetMesh.position.z = pos.z;
                return this.resetMesh;
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
    //
    //Main
    createScreenGameOver() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const size = {
                    w: 3,
                    h: 2,
                    d: 1
                };
                const pos = {
                    x: 0,
                    y: 0,
                    z: -3
                };
                const geometry = new THREE.BoxGeometry(size.w, size.h, size.d);
                const material = new THREE.MeshBasicMaterial({
                    color: 'rgb(82, 77, 77)',
                    transparent: true,
                    opacity: 0.0
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.x = pos.x;
                mesh.position.y = pos.y;
                mesh.position.z = pos.z;
                //Content
                const gameOverTextContent = yield this.createGameOverText();
                const scoreContent = yield this.createGameOverScore();
                const resetContent = yield this.resetText();
                mesh.add(gameOverTextContent);
                mesh.add(scoreContent);
                mesh.add(resetContent);
                this.group.add(gameOverTextContent);
                this.group.add(scoreContent);
                this.group.add(resetContent);
                this.group.add(mesh);
                this.startFadeIn();
                if (this.messageInterval)
                    clearInterval(this.messageInterval);
                this.messageInterval = window.setInterval(() => __awaiter(this, void 0, void 0, function* () { return yield this.showMessage(); }), this.intervalDuration);
                this.group.position.y = 0.3;
                //
                this.camera.camera.add(this.group);
            }
            catch (err) {
                console.log(err);
                throw err;
            }
        });
    }
    hideMessage() {
        this.isReseted = false;
        this.score.hideScore(true);
        this.camera.hideMessage(true);
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
            this.messageInterval = undefined;
        }
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
            this.blinkInterval = undefined;
        }
        if (this.group.parent)
            this.group.parent.remove(this.group);
        this.group.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose();
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                }
                else {
                    obj.material.dispose();
                }
            }
        });
        this.hasMessageShown = false;
        this.fadeState = 'none';
        this.fadeProgress = 0;
        this.group.clear();
        if (this.gameOverTextMat)
            this.gameOverTextMat.dispose();
        if (this.gameOverScoreMat)
            this.gameOverScoreMat.dispose();
        if (this.resetMat)
            this.resetMat.dispose();
    }
    onReseted() {
        this.isReseted = true;
        this.fadeState = 'none';
    }
    update(deltaTime) {
        if (!this.gameOverTextMat || !this.gameOverScoreMat || !this.resetMat)
            return;
        const now = performance.now();
        const timeFactor = this.time.getTimeFactor();
        const internalTime = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.1) : 0;
        this.lastTime = now;
        const dayColor = {
            t: this.colors.t_day,
            s: this.colors.s_day,
            r: this.colors.r_day
        };
        const nightColor = {
            t: this.colors.t_night,
            s: this.colors.s_night,
            r: this.colors.r_night
        };
        this.gameOverTextMat.color.lerpColors(nightColor.t, dayColor.t, timeFactor);
        this.gameOverScoreMat.color.lerpColors(nightColor.s, dayColor.s, timeFactor);
        if (!this.isReseted) {
            this.resetMat.color.lerpColors(this.colors.r_night, this.colors.r_day, timeFactor);
        }
        else {
            this.resetMat.color.copy(this.colors.selec);
        }
        this.gameOverTextMat.needsUpdate = true;
        this.gameOverScoreMat.needsUpdate = true;
        this.resetMat.needsUpdate = true;
        this.updateFade(internalTime);
    }
    ready() {
        return __awaiter(this, void 0, void 0, function* () {
            this.score.hideScore(false);
            this.camera.hideMessage(false);
            return this.createScreenGameOver();
        });
    }
}
