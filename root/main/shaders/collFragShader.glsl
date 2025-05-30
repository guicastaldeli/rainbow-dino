uniform bool isColl;
uniform vec3 originalColor;

uniform vec3 clipNormal;
uniform float clipConstant;

varying vec3 vPosition;
varying vec3 vNormal;

varying vec2 vUv;
uniform sampler2D map;

void main() {
    float clipValue = dot(vPosition, clipNormal) + clipConstant;
    vec4 texColor = texture2D(map, vUv);

    if(clipValue > 0.0) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        gl_FragColor = texColor;
    }
}