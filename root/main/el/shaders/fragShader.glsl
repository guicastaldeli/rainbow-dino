uniform float time;
uniform float timeFactor;
uniform sampler2D map;
varying vec2 vUv;

void main() {
    vec4 texColor = texture2D(map, vUv);

    float nightFade = smoothstep(0.3, 0.4, timeFactor);
    vec3 nightColor = vec3(0.5);

    float dayFade = smoothstep(0.6, 0.998, timeFactor);
    vec3 dayColor = texColor(time * 0.1 + vUv.x + vUv.y) * texColor.rgb;

    vec3 finalColor = mix(nightColor, dayColor, dayFade);

    gl_FragColor = vec4(finalColor, texColor.a);
}