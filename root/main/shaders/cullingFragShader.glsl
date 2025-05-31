varying vec2 vUv;
varying vec3 vWorldPosition;
uniform float time;
uniform float timeFactor;

uniform sampler2D map;
uniform vec4 bounds;

void main() {
    if(vWorldPosition.x < bounds.x || 
       vWorldPosition.x > bounds.y || 
       vWorldPosition.y < bounds.z || 
       vWorldPosition.y > bounds.w) {

        discard;
    }
}