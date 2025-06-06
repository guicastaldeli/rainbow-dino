precision highp float;

uniform float time;
uniform float timeFactor;

uniform bool shouldBlink;

varying vec2 vUv;

void main() {
    vec3 fDayColor = vec3(0.5529, 0.5529, 0.5529);
    vec3 bDayColor = vec3(0.1765, 0.1765, 0.1765);
    vec3 dayColor = (vUv.y > 0.9) ? bDayColor : fDayColor;

    vec3 fNightColor = vec3(0.702, 0.702, 0.702);
    vec3 bNightColor = vec3(0.9098, 0.9098, 0.9098);
    vec3 nightColor = (vUv.y > 0.9) ? bNightColor : fNightColor;

    float blendColor = smoothstep(0.3, 0.7, timeFactor);
    vec3 finalColor = mix(nightColor, dayColor, blendColor);

    //Blink
        if(shouldBlink) discard;
    //

    gl_FragColor = vec4(finalColor, 1.0);
}