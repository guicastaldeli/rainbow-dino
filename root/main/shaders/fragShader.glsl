uniform float timeFactor;
uniform float uTime;

uniform vec2 resolution;
varying vec3 vPosition;

float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec3 pos = normalize(vPosition);

    //Day Color
    vec3 dayColorTop = vec3(1.0, 1.0, 1.0);
    vec3 dayColorBottom = vec3(0.8667, 0.8667, 0.8667);

    //Night Color
    vec3 nightTopColor = vec3(0.051, 0.0588, 0.0941);
    vec3 nightColorBottom = vec3(0.1216, 0.1451, 0.2235);

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
        float starIntensity = 1.0 - smoothstep(0.0, 1.5, timeFactor);
        float starDestiny = 0.9;

        float fRand = rand(pos.xy);
        float sRand = rand(pos.xy * 2.0);
        float sizeRand = rand(pos.xy * 3.0);

        if(fRand > starDestiny) {
            float starSize = mix(0.001, 0.002, sizeRand);

            float brightness = smoothstep(0.001, 0.02, pow(sizeRand, 2.0));
            brightness = mix(0.3, 1.5, brightness);

            float star = smoothstep(1.0 - starSize, 1.0, fRand);
            float twinkle = sin(uTime * 3.0 + pos.x * 50.0) * 0.2 + 0.8;        
            vec3 starColor = vec3(star * brightness * starIntensity * twinkle);
    
            finalColor += starColor * star;
        }
    }

    gl_FragColor = vec4(finalColor, 1.0);
}