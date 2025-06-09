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
import { Tick } from './tick.js';
import { Time } from './time.js';
import { Camera } from './camera.js';
import { Lightning } from './lightning.js';
import { Score } from './score.js';
import { Display } from './display.js';
import { Skybox } from './skybox.js';
import { ScreenGameOver } from './screens/game-over-screen.js';
const canvas = (document.getElementById('game--container'));
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
//Renderer
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas,
});
renderer.autoClear = false;
renderer.localClippingEnabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
export const scene = new THREE.Scene();
const tick = new Tick();
//Render
//Time and Skybox
const timeCycle = new Time(tick);
const skybox = new Skybox(tick, timeCycle);
skybox.ready().then(() => {
    scene.add(skybox.mesh);
}).catch(err => {
    console.error(err);
});
//Camera
const camera = new Camera(renderer);
scene.add(camera.camera);
//Score
const score = new Score(tick, timeCycle);
score.ready().then(() => {
    camera.camera.add(score.getScore());
}).catch(err => {
    console.error(err);
});
//Main Display
const renderDisplay = new Display(tick, timeCycle, renderer, scene);
renderDisplay.ready().then(() => {
    scene.add(renderDisplay.display);
});
//
//Lightning
const lightning = new Lightning(tick, timeCycle);
const lights = lightning.addLights();
lights.forEach(l => scene.add(l));
//
//Game State
let gameState;
function saveState() {
    gameState = {
        time: {
            currentTime: timeCycle.getTotalTime(),
            scrollSpeed: timeCycle['scrollSpeed']
        },
        score: {
            currentScore: score.getCurrentScore()
        },
        tick: {
            paused: tick['paused'],
            gameOver: tick['gameOver']
        }
    };
}
saveState();
//
//Screens
//Pause
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        tick.togglePause();
    }
});
//Game Over
const screenGameOver = new ScreenGameOver(gameState, timeCycle, tick, score, camera);
tick.onGameOver(() => __awaiter(void 0, void 0, void 0, function* () {
    score.getFinalScore();
    yield screenGameOver.ready();
}));
function resetGame() {
    window.addEventListener('keydown', (e) => __awaiter(this, void 0, void 0, function* () {
        if (e.key === 'Escape') {
            if (tick['gameOver']) {
                e.preventDefault();
                yield screenGameOver.resetGame();
                saveState();
            }
        }
    }));
}
resetGame();
//
//
function resizeRenderer() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderer.setSize(canvas.width, canvas.height);
    camera.camera.updateProjectionMatrix();
    window.addEventListener('resize', resizeRenderer);
}
resizeRenderer();
//Main Render
let lastTime = 0;
function render() {
    const now = performance.now();
    const deltaTime = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
    lastTime = now;
    const scaledDelta = tick.getScaledDelta(deltaTime);
    timeCycle.update(scaledDelta);
    lightning.update(scaledDelta);
    lightning.updateLightHelper();
    score.update(scaledDelta);
    skybox.update(scaledDelta);
    renderDisplay.update(scaledDelta);
    screenGameOver.update(scaledDelta);
    camera.update(scaledDelta);
    renderer.render(scene, camera.camera);
    requestAnimationFrame(render);
}
function init() {
    resizeRenderer();
    render();
}
init();
//
