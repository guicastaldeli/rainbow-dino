precision highp float;

varying vec3 mvPosition;
varying vec2 vUv;

void main() {
    vUv = uv;
    
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    mvPosition = mvPos.xyz;

    gl_Position = projectionMatrix * mvPos;
}