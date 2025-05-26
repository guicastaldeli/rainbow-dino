import * as THREE from 'three';

import { Camera } from '../out/camera.js';
import { Terrain } from '../out/terrain.js';

const canvas = <HTMLCanvasElement>(document.getElementById('game--container'));
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const camera = new Camera(renderer);
scene.add(camera.camera);

//Renders
    //Terrain
    const renderTerrain = new Terrain().createTerrain();
    scene.add(renderTerrain);
//

//Render
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

