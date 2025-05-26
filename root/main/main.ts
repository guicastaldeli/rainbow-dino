import * as THREE from 'three';

import { Camera } from './camera.js';
import { Display } from './display.js';

const canvas = <HTMLCanvasElement>(document.getElementById('game--container'));
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

//Render
    //Camera
    const camera = new Camera(renderer);
    scene.add(camera.camera);

    //Main Display
    const renderDisplay = new Display();
    scene.add(renderDisplay.display);
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
        camera.updateCamera();
        renderer.render(scene, camera.camera!);

        requestAnimationFrame(render);
    }

    function init() {
        render();
    }

    init();
//

