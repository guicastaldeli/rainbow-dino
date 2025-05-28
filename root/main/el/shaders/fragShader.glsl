uniform float time;
uniform float timeFactor;
uniform sampler2D map;
varying vec2 vUv;

void main() {
    vec4 texColor = texture2D(map, vUv);

    float grayscale = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    vec3 nightColor = vec3(grayscale);
    
    vec3 dayColor = texColor.rgb;

    float blendFactor = smoothstep(0.3, 0.7, timeFactor);
    vec3 finalColor = mix(nightColor, dayColor, blendFactor);

    gl_FragColor = vec4(finalColor, texColor.a);
}