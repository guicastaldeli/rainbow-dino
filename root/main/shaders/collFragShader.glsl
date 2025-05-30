uniform bool isColl;
uniform vec3 originalColor;
uniform float uTime;

uniform vec3 clipNormal;
uniform float clipConstant;

varying vec3 vPosition;
varying vec3 vNormal;

varying vec2 vUv;
uniform sampler2D map;

void main() {
    vec4 texColor = texture2D(map, vUv);

    if(isColl) {
        float clipValue = dot(vPosition, clipNormal) + clipConstant;
        if(clipValue < 0.1) {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        } else {
            gl_FragColor = texColor;
        }
    } else {
        gl_FragColor = texColor;
    }
}