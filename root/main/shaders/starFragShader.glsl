precision highp float;

uniform float timeFactor;
uniform float time;

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
    float rotationAngle;
    vec2 coord;
    float edgeX;
    float edgeY;
    vec3 starColor;

    if(timeFactor < 0.3) {
        rotationAngle = vPhase + time * 0.1;
        coord = rotate(gl_PointCoord - 0.5, rotationAngle);

        edgeX = smoothstep(0.3, 0.2, abs(coord.x));
        edgeY = smoothstep(0.3, 0.2, abs(coord.y));

        if(edgeX * edgeY < 0.01) discard;
    } else {
        rotationAngle = vPhase + time * 0.1;
        coord = rotate(gl_PointCoord - 0.5, rotationAngle);

        edgeX = smoothstep(0.7, 0.65, abs(coord.x));
        edgeY = smoothstep(0.7, 0.65, abs(coord.y));

        if(edgeX * edgeY < 0.01) discard;
    }

    //Night
    float nightFade = smoothstep(0.3, 0.4, timeFactor);
    vec3 nightColor = mix(vec3(0.5), vec3(0.4863), nightFade);

    //Dusk-Dawn
    float duskDawnFade = smoothstep(0.4, 0.6, timeFactor);
    vec3 duskDawnColor = mix(nightColor, vec3(0.4863), duskDawnFade);

    //Day
    float dayFade = smoothstep(0.6, 0.998, timeFactor);
    vec3 baseDayColor = rainbow(vPhase + time * 0.1);
    vec3 dayColor = mix(duskDawnColor, baseDayColor, dayFade);

    starColor = mix(nightColor, duskDawnColor, smoothstep(0.3, 0.4, timeFactor));
    starColor = mix(starColor, dayColor, smoothstep(0.6, 0.998, timeFactor));

    float twinkle = sin(time * 2.0 + vPhase * 30.0) * 0.2 + 0.8;
    starColor *= twinkle;

    gl_FragColor = vec4(starColor, 1.0);
}