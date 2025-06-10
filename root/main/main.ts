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

import { ScreenPauseMenu } from './screens/pause-menu.js';
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
//

export const scene = new THREE.Scene();
const tick = new Tick();
const gameState = tick.getState();
let lastTime = 0;

//Game State
    tick.setState('loading');

    let assetsLoaded = {
        skybox: false,
        score: false,
        display: false
    }

    function checkLoadingComplete() {
        if(Object.values(assetsLoaded)
            .every(loaded => loaded)) {
            tick.run();
        }
    }

    checkLoadingComplete()
//

//Render
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
    const score = new Score(gameState, tick, timeCycle);
    
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
        const screenPause = 
            new ScreenPauseMenu(
                gameState,
                timeCycle,
                tick,
                camera
            )
        ;

        async function pauseGame() {
            window.addEventListener('keydown', async (e) => {
                if(e.key === 'Escape') {
                    if(gameState.current === 'running' || gameState.current == 'paused') {
                        tick.togglePause();
                        await screenPause.ready();
                    }

                    tick.setScreenPause(screenPause);
                }
            });
        }

        setTimeout(() => pauseGame(), 1000);
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
            if(gameState.current === 'game-over') {
                window.location.reload();
            }
        }

        window.addEventListener('keydown', async (e) => {
            if(e.key === 'Escape') {
                if(gameState.current === 'game-over') {
                    resetGame();
                }
            }
        });
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

        if(gameState.current === 'running') {
            timeCycle.update(scaledDelta);

            lightning.update(scaledDelta);
            //lightning.updateLightHelper();
    
            score.update(scaledDelta);
            skybox.update(scaledDelta);

            renderDisplay.update(scaledDelta);
        }

        screenPause.update(scaledDelta);
        screenGameOver.update(scaledDelta);
        
        camera.update(scaledDelta);
        renderer.render(scene, camera.camera!);
        requestAnimationFrame(render);
    }

    function init() {
        resizeRenderer();
        render();
    }

    init();
//