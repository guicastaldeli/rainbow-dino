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
import { Player } from './el/player.js';
import { ScreenMainMenu } from './screens/main-menu.js';
import { ScreenPauseMenu } from './screens/pause-menu.js';
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
//
export const scene = new THREE.Scene();
const tick = new Tick();
const gameState = tick.getState();
let lastTime = 0;
//Game State
let isInitLoad = true;
tick.setState('menu');
let assetsLoaded = {
    skybox: false,
    score: false,
    display: false
};
function checkRunning(e) {
    if (Object.values(assetsLoaded)
        .every(loaded => loaded)) {
        if (isInitLoad) {
            tick.setState('menu');
        }
        else {
            if (e)
                startHandler(e);
            activePause();
        }
    }
}
//
//Render
//Time and Skybox
const timeCycle = new Time(tick);
const skybox = new Skybox(tick, timeCycle);
skybox.ready().then(() => {
    scene.add(skybox.mesh);
    assetsLoaded.skybox = true;
    checkRunning();
}).catch(err => {
    console.error(err);
});
//Camera
const camera = new Camera(tick, renderer);
scene.add(camera.camera);
//Score
const score = new Score(gameState, tick, timeCycle);
tick.onStateChange((s) => {
    if (s === 'running') {
        if (!assetsLoaded.score) {
            score.ready().then(() => {
                camera.camera.add(score.getScore());
                assetsLoaded.score = true;
                checkRunning();
            }).catch(err => {
                console.error(err);
            });
        }
    }
});
//Main Display
const renderDisplay = new Display(gameState, tick, timeCycle, renderer, scene);
tick.onStateChange((s) => {
    if (s === 'running') {
        if (!assetsLoaded.score) {
            renderDisplay.ready().then(() => {
                scene.add(renderDisplay.display);
                assetsLoaded.display = true;
                checkRunning();
            });
        }
    }
});
//Player Ref
const player = new Player(tick, timeCycle);
//
//Lightning
const lightning = new Lightning(tick, timeCycle);
const lights = lightning.addLights();
lights.forEach(l => scene.add(l));
//
//Screens
//Menu
const screenMenu = new ScreenMainMenu(gameState, tick, timeCycle, camera, score);
//Menu
function showMenu() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield screenMenu.ready();
        }
        catch (err) {
            console.log(err);
        }
    });
}
showMenu();
tick.setScreenMenu(screenMenu);
//Start
function startHandler(e) {
    if (e.key && gameState.current === 'menu') {
        screenMenu.onStarted();
        setTimeout(() => {
            isInitLoad = false;
            e.preventDefault();
            e.stopPropagation();
            screenMenu.hideMenu();
            tick.setState('running');
            tick.run();
            window.removeEventListener('keydown', startHandler);
        }, 500);
    }
}
window.addEventListener('keydown', startHandler);
//
//Pause
const screenPause = new ScreenPauseMenu(gameState, timeCycle, tick, camera);
function pauseHandler(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (gameState.current === 'running' ||
            gameState.current === 'paused') {
            tick.togglePause();
        }
    }
}
function pause() {
    return __awaiter(this, void 0, void 0, function* () {
        if (gameState.current !== 'menu') {
            window.addEventListener('keydown', pauseHandler);
            tick.setScreenPause(screenPause);
        }
    });
}
function activePause() {
    tick.setScreenPause(screenPause);
    window.addEventListener('keydown', pauseHandler);
}
//
//Game Over
const screenGameOver = new ScreenGameOver(gameState, tick, timeCycle, score, camera, player);
tick.onGameOver(() => __awaiter(void 0, void 0, void 0, function* () {
    score.onGameEnd();
    score.getFinalScore();
    yield screenGameOver.ready();
    screenMenu.updateHighScore();
}));
//
//Reset
function reset() {
    lastTime = 0;
    window.removeEventListener('keydown', pauseHandler);
    window.removeEventListener('keydown', startHandler);
    scene.remove(renderDisplay.display);
    tick.setState('running');
    timeCycle.resetState();
    lightning.resetState();
    score.resetState();
    camera.resetState();
    camera.hideMessage(true);
    renderDisplay.resetState();
    screenPause.hideMessage();
    screenGameOver.hideMessage();
    assetsLoaded = {
        skybox: false,
        score: false,
        display: false
    };
    scene.add(renderDisplay.display);
    setTimeout(() => {
        checkRunning();
        pause();
        window.addEventListener('keydown', pauseHandler);
    }, 1000);
}
tick.onReset(() => reset());
window.addEventListener('keydown', (e) => __awaiter(void 0, void 0, void 0, function* () {
    if (e.key === 'Escape')
        tick.reset();
}));
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
function render() {
    const now = performance.now();
    const deltaTime = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
    lastTime = now;
    const scaledDelta = tick.getScaledDelta(deltaTime);
    timeCycle.update(scaledDelta);
    lightning.update(scaledDelta);
    skybox.update(scaledDelta);
    if (gameState.current === 'running')
        score.update(scaledDelta);
    renderDisplay.update(scaledDelta);
    screenMenu.update(scaledDelta);
    screenPause.update(scaledDelta);
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
