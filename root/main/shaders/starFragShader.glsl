precision highp float;

uniform float time;
uniform float timeFactor;
uniform float timeScale;

varying vec3 vColor;
varying float vPhase;

vec3 rainbow(float t) {
    t = fract(t);

    vec3 c = vec3(
        abs(t * 6.0 - 3.0) - 1.0,
        2.0 - abs(t * 6.0 - 2.0),
        2.0 - abs(t * 6.0 - 4.0)
    );

    return clamp(c, 0.0, 1.0);
}

vec2 rotate(vec2 coord, float angle) {
    float sinA = sin(angle);
    float cosA = cos(angle);

    return vec2(
        coord.x * cosA - coord.y * sinA,
        coord.x * sinA + coord.y * cosA
    );
}

void main() {
    float scaledTime = time * timeScale;

    float rotationAngle = vPhase + scaledTime * 0.1;
    float timeAngle = smoothstep(0.0, 1.0, timeFactor) * 3.14159 * 2.0;
    rotationAngle += timeAngle;

    rotationAngle = mix(rotationAngle, rotationAngle * 1.5, smoothstep(0.3, 0.6, timeFactor));
    vec2 coord = rotate(gl_PointCoord - 0.5, rotationAngle);

    float edgeThreshold = mix(0.3, 0.7, smoothstep(0.3, 0.6, timeFactor));
    float edgeX = smoothstep(edgeThreshold, edgeThreshold - 0.1, abs(coord.x));
    float edgeY = smoothstep(edgeThreshold, edgeThreshold - 0.1, abs(coord.y));
    if(edgeX * edgeY < 0.01) discard;

    //Star Color
    vec3 starColor;

    //Night
    float nightFade = smoothstep(0.3, 0.4, timeFactor);
    vec3 nightColor = mix(vec3(0.5), vec3(0.4863), nightFade);

    //Dusk-Dawn
    float duskDawnFade = smoothstep(0.4, 0.6, timeFactor);
    vec3 duskDawnColor = mix(nightColor, vec3(0.4863), duskDawnFade);

    //Day
    float dayFade = smoothstep(0.6, 0.998, timeFactor);
    vec3 baseDayColor = rainbow(vPhase + scaledTime * 0.1);
    vec3 dayColor = mix(duskDawnColor, baseDayColor, dayFade);

    starColor = mix(nightColor, duskDawnColor, smoothstep(0.3, 0.4, timeFactor));
    starColor = mix(starColor, dayColor, smoothstep(0.6, 0.998, timeFactor));

    float twinkle = sin(scaledTime * 2.0 + vPhase * 30.0) * 0.2 + 0.8;
    starColor *= twinkle;

    gl_FragColor = vec4(starColor, 1.0);
}