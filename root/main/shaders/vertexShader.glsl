precision highp float;

varying vec2 vUv;
varying vec3 mvPosition;

attribute float scale;
attribute vec3 color;
attribute float phase;

varying vec3 vColor;
varying float vPhase;

uniform float time;
uniform float size;

void main() {
    vColor = color;
    vPhase = phase;
    vUv = uv;

    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    mvPosition = mvPos.xyz;

    float twinkle = sin(time * 2.0 + phase * 10.0) * 0.5 + 1.5;
    float finalSize = size * scale * twinkle;

    gl_PointSize = finalSize * (50.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPos;
}