varying vec2 vUv;
uniform vec4 clippingPlanes[12];
varying float vClipDistance[12];

void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}