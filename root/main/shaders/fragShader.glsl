uniform float timeFactor;

uniform vec2 resolution;
varying vec3 mvPosition;

varying vec3 vColor;
varying float vPhase;

float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec3 pos = normalize(mvPosition);

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

    vec2 coord = gl_PointCoord - vec2(0.5);
    if(length(coord) > 0.5) discard;

    float glow = pow(1.0 - (length(coord) * 1.5), 2.0);
    float center = smoothstep (0.4, 0.2, length(coord));
    vec3 starColor = vColor * (glow + center * 2.0);

    gl_FragColor = vec4(finalColor, 1.0);
}