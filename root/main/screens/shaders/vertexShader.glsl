precision highp float;

varying vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
    vUv = uv;
    vNormal = normalMatrix * normal;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}