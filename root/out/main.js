import * as THREE from 'three';
import { Camera } from './camera.js';
import { Display } from './display.js';
const canvas = (document.getElementById('game--container'));
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
const camera = new Camera(renderer);
scene.add(camera.camera);
//Render
//Main Display
const renderDisplay = new Display();
scene.add(renderDisplay.display);
//
//Main Render
function render() {
    camera.updateCamera();
    renderer.render(scene, camera.camera);
    requestAnimationFrame(render);
}
function init() {
    render();
}
init();
//
