precision highp float;

varying vec2 vUv;
varying vec3 mvPosition;

void main() {
    vUv = uv;

    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    mvPosition = mvPos.xyz;

    gl_Position = projectionMatrix * mvPos;
}