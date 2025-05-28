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
    vec3 starColor;

    float rotationAngle = vPhase + time * 0.1;
    vec2 coord = rotate(gl_PointCoord - 0.5, rotationAngle);

    if(timeFactor < 0.4) {
        if(abs(coord.x) > 0.5 || abs(coord.y) > 0.6) discard;
    } else {
        if(abs(coord.x) > 0.5 || abs(coord.y > 0.5)) discard;
    }

    if(timeFactor < 0.4) {
        //Night
        starColor = vec3(0.5);
    } else if(timeFactor < 0.998) {
        //Dusk-Dawn
        float fade = smoothstep(0.7, 1.5, timeFactor);
        starColor = mix(vec3(0.4863, 0.4863, 0.4863), vec3(1.0), fade);
    } else {
        //Day
        starColor = rainbow(vPhase + time * 0.1);
    }

    float twinkle = sin(time * 2.0 + vPhase * 30.0) * 0.2 + 0.8;
    starColor *= twinkle;

    gl_FragColor = vec4(starColor, 1.0);
}