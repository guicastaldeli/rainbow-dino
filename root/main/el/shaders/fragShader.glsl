uniform float time;
uniform float timeFactor;
uniform sampler2D map;
varying vec2 vUv;

void main() {
    vec4 texColor = texture2D(map, vUv);

    vec3 nightColor = vec3(0.2118, 0.2118, 0.2118) * texColor.a;
    vec3 dayColor = texColor.rgb;

    float blendFactor = smoothstep(0.3, 0.7, timeFactor);
    vec3 mixColors = mix(nightColor, dayColor, blendFactor);
    vec3 finalColor = texColor.rgb * mixColors;

    gl_FragColor = vec4(finalColor, texColor.a);
}