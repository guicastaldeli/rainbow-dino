varying vec2 vUv;
varying vec3 vWorldPosition;
uniform float time;
uniform float timeFactor;

uniform sampler2D map;
uniform vec4 bounds;

void main() {
    vec4 texColor = texture2D(map, vUv);

    vec3 nightColor = vec3(1.0);
    vec3 dayColor = texColor.rgb;

    float blendColor = smoothstep(0.3, 0.7, timeFactor);
    vec3 finalColor = mix(nightColor, dayColor, blendColor);

    gl_FragColor = vec4(finalColor, texColor.a);
}