precision highp float;

uniform float time;
uniform float timeScale;

varying vec3 vColor;
varying float vPhase;

uniform float size;
attribute vec3 color;
attribute float scale;
attribute float phase;

void main() {
    vColor = color;
    vPhase = phase;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    float scaledTime = time * timeScale;
    float twinkle = sin(scaledTime * 2.0 + vPhase * 30.0) * 0.5 + 1.5;
    float finalSize = size * scale * twinkle;

    gl_PointSize = finalSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}