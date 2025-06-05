precision highp float;

uniform float time;
uniform float timeFactor;

void main() {
    vec3 dayColor = vec3(0.5529, 0.5529, 0.5529);
    vec3 nightColor = vec3(0.702, 0.702, 0.702);

    float blendColor = smoothstep(0.3, 0.7, timeFactor);
    vec3 color = mix(nightColor, dayColor, blendColor);
    vec3 finalColor = color;

    gl_FragColor = vec4(finalColor, 1.0);
}