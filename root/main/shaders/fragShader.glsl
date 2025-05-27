uniform float timeFactor;
uniform vec2 resolution;
varying vec3 vPosition;

void main() {
    vec3 pos = normalize(vPosition);

    //Day Color
    vec3 dayColorTop = vec3(1.0, 1.0, 1.0);
    vec3 dayColorBottom = vec3(0.8667, 0.8667, 0.8667);

    //Night Color
    vec3 nightTopColor = vec3(0.1216, 0.1451, 0.2235);
    vec3 nightColorBottom = vec3(0.051, 0.0588, 0.0941);

    //Dusk-Dawn Color
    vec3 duskDawnColorTop = vec3(0.8, 0.4, 0.1);
    vec3 duskDawnColorBottom = vec3(0.4, 0.2, 0.5);

    vec3 colorTop = mix(nightTopColor, duskDawnColorTop, smoothstep(0.0, 0.5, timeFactor));
    vec3 colorBottom = mix(nightColorBottom, duskDawnColorBottom, smoothstep(0.0, 0.5, timeFactor));

    colorTop = mix(colorTop, dayColorTop, smoothstep(0.5, 1.0, timeFactor));
    colorBottom = mix(colorBottom, dayColorBottom, smoothstep(0.5, 1.0, timeFactor));

    float gradient = smoothstep(-1.0, 1.0, pos.y);
    vec3 finalColor = mix(colorBottom, colorTop, gradient);

    if(timeFactor < 0.3) {
        float starIntensity = 1.0 - smoothstep(0.0, 0.3, timeFactor);
        float star = fract(sin(dot(pos.xy, vec2(12.9898, 78.233))) * 43758.5453);
        if(star > 0.98) finalColor += star * starIntensity;
    }

    gl_FragColor = vec4(finalColor, 1.0);
}