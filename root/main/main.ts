import * as THREE from 'three';

import { GameState } from './game-state.js';
import { Tick } from './tick.js';
import { Time } from './time.js';
import { Camera } from './camera.js';
import { Lightning } from './lightning.js';
import { Score } from './score.js';
import { Display } from './display.js';
import { Skybox } from './skybox.js';
import { Player } from './el/player.js';

import { ScreenGameOver } from './screens/game-over-screen.js';

const canvas = <HTMLCanvasElement>(document.getElementById('game--container'));
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
let initialSceneState: THREE.Object3D;

function saveInitialState() {
    initialSceneState = scene.clone();
}

saveInitialState();

const tick = new Tick();
let lastTime = 0;

//Game State
    let gameState!: GameState;

    function checkLoadingComplete() {
        if(Object.values(assetsLoaded).every(loaded => loaded)) {
            gameState = {
                current: 'running',
                prev: 'loading',
                tick: { timeScale: tick.getState() }
            }
        }
    }

    function currentState() {
        gameState = {
            current: 'loading',
            prev: null,
            tick: { timeScale: 0.0 }
        }
    }

    currentState();
//

//Render
    let assetsLoaded = {
        skybox: false,
        score: false,
        display: false
    }

    //Time and Skybox
    const timeCycle = new Time(tick);
    const skybox = new Skybox(tick, timeCycle);

    skybox.ready().then(() => {
        scene.add(skybox.mesh);
        assetsLoaded.skybox = true;
        checkLoadingComplete();
    }).catch(err => {
        console.error(err);
    });

    //Camera
    const camera = new Camera(tick, renderer);
    scene.add(camera.camera);

    //Score
    const score = new Score(tick, timeCycle);
    
    score.ready().then(() => {
        camera.camera.add(score.getScore());
        assetsLoaded.score = true;
        checkLoadingComplete();
    }).catch(err => {
        console.error(err);
    });

    //Main Display
    const renderDisplay = new Display(gameState, tick, timeCycle, renderer, scene);

    renderDisplay.ready().then(() => {
        scene.add(renderDisplay.display);
        assetsLoaded.display = true;
        checkLoadingComplete();
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
    //Pause
        async function pauseGame() {
            window.addEventListener('keydown', async (e) => {
                if(e.key === 'Escape' && gameState.current === 'running') {
                    tick.togglePause();
                }
            });
        }

        pauseGame();
    //
    
    //Game Over
        const screenGameOver = 
            new ScreenGameOver(
                gameState, 
                timeCycle, 
                tick, 
                score, 
                camera,
                player
            )
        ;

        tick.onGameOver(async () => {
            score.getFinalScore();
            await screenGameOver.ready();
        });

        export function resetGame() {
            window.addEventListener('keydown', async (e) => {
                if(e.key === 'Escape') {
                    if(gameState.current === 'game-over') {
                        await screenGameOver.handleReset();
                    }
                }
            });
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
    function render() {
        const now = performance.now();
        const deltaTime = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
        lastTime = now;

        const scaledDelta = tick.getScaledDelta(deltaTime);
        const currentState = tick.getState();

        if(currentState === 'running') {
            timeCycle.update(scaledDelta);

            lightning.update(scaledDelta);
            //lightning.updateLightHelper();
    
            score.update(scaledDelta);
            skybox.update(scaledDelta);

            renderDisplay.update(scaledDelta);
        }

        screenGameOver.update(scaledDelta);
        
        camera.update(scaledDelta);
        renderer.render(scene, camera.camera!);
        requestAnimationFrame(render);
        console.log(currentState)
    }

    function init() {
        resizeRenderer();
        render();
    }

    init();
//