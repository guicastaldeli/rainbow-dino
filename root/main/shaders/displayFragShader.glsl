precision highp float;

varying vec2 vUv;
varying vec3 vWorldPosition;
uniform float time;
uniform float timeFactor;

uniform sampler2D map;
uniform vec4 bounds;

uniform vec3 ambientLightColor;
uniform float ambientLightIntensity;

uniform vec3 directionalLightColor;
uniform float directionalLightIntensity;
uniform vec3 directionalLightPosition;

void main() {
    vec4 texColor = texture2D(map, vUv);

    vec3 nightColor = vec3(1.0);
    vec3 dayColor = texColor.rgb;

    float blendColor = smoothstep(0.3, 0.7, timeFactor);
    vec3 finalColor = mix(nightColor, dayColor, blendColor);

    vec3 ambient = ambientLightColor * ambientLightIntensity;

    vec3 normal = vec3(0.0, 0.0, 1.0);
    float diff = max(dot(normal, directionalLightPosition), 0.0);
    vec3 directional = directionalLightColor * directionalLightIntensity * diff;

    vec3 lightning = ambient + directional;
    finalColor *= lightning;

    gl_FragColor = vec4(finalColor, texColor.a);
}