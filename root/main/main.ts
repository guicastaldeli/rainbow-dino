import * as THREE from 'three';

import { Tick } from './tick.js';
import { Time } from './time.js';
import { Score } from './score.js';
import { Display } from './display.js';
import { Camera } from './camera.js';
import { Skybox } from './skybox.js';

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

    //Score
    //const score = new Score(tick, timeCycle);

    //Camera
    const camera = new Camera(renderer);
    scene.add(camera.camera);

    //Main Display
    const renderDisplay = new Display(tick, timeCycle, renderer, scene);

    renderDisplay.ready().then(() => {
        scene.add(renderDisplay.display);
    });
//

function resizeRenderer() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    renderer.setSize(canvas.width, canvas.height);
    camera.camera.updateProjectionMatrix();

    window.addEventListener('resize', resizeRenderer);
}

resizeRenderer();

//Pause
window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
        tick.togglePause();
    }
})

//Main Render
    let lastTime = 0;

    function render() {
        const now = performance.now();
        const deltaTime = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
        lastTime = now;

        const scaledDelta = tick.getScaledDelta(deltaTime);

        timeCycle.update(scaledDelta);
        //score.update(scaledDelta)
        skybox.update(scaledDelta);
        renderDisplay.update(scaledDelta);
        
        camera.update();
        renderer.render(scene, camera.camera!);
        requestAnimationFrame(render);
    }

    function init() {
        resizeRenderer();
        render();
    }

    init();
//