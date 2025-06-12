precision highp float;

uniform float time;
uniform float timeFactor;
uniform sampler2D map;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

uniform float letterCount;
uniform float scrollSpeed;

uniform sampler2D shadowMap;
uniform float shadowBias;
uniform float shadowRadius;

uniform vec3 ambientLightColor;
uniform float ambientLightIntensity;

uniform vec3 directionalLightColor;
uniform float directionalLightIntensity;
uniform vec3 directionalLightPosition;
uniform mat4 directionalLightShadowMatrix;


float getShadow(vec4 shadowCoord, vec3 lightDir, vec3 normal) {
    float bias = max(shadowBias * (1.0 - dot(normal, lightDir)), shadowBias * 0.1);

    vec3 projCoords = shadowCoord.xyz / shadowCoord.w;
    projCoords = projCoords * 0.5 + 0.5;

    if(projCoords.z > 1.0 || 
        projCoords.x < 0.0 || projCoords.x > 1.0 || 
        projCoords.y < 0.0 || projCoords.y > 1.0) {
        return 0.0;
    }

    float shadow = 0.0;
    vec2 texelSize = 1.0 / vec2(textureSize(shadowMap, 0));

    for(int x = -1; x <= 1; ++x) {
        for(int y = -1; y <= 1; ++y) {
            float pcfDepth = texture2D(shadowMap, projCoords.xy + vec2(x, y) * texelSize * shadowRadius).r;
            shadow += projCoords.z - bias > pcfDepth ? 1.0 : 0.0;
        }
    }

    shadow /= 9.0;
    return shadow;
}

vec3 getColorFromIndex(float index) {
    if (index < 1.0) return vec3(0.620, 0.737, 1.000);
    if (index < 2.0) return vec3(0.620, 0.737, 1.000);
    if (index < 3.0) return vec3(0.847, 0.894, 1.000);
    if (index < 4.0) return vec3(0.847, 0.768, 1.000);
    if (index < 5.0) return vec3(0.847, 0.498, 1.000);
    if (index < 6.0) return vec3(1.000, 0.400, 0.788);
    if (index < 7.0) return vec3(1.000, 0.400, 0.620);
    if (index < 8.0) return vec3(1.000, 0.624, 0.478);
    if (index < 9.0) return vec3(1.000, 0.768, 0.467);
    return vec3(0.898, 1.000, 0.569);
}

void main() {
    vec4 texColor = texture2D(map, vUv);
    
    float letterWidth = 1.0 / letterCount;
    float currentIndex = floor(vUv.x / letterWidth);

    float colorIndex = mod(floor(currentIndex + time * scrollSpeed * 10.0), 10.0);
    vec3 color = getColorFromIndex(colorIndex);

    vec3 updColor = texColor.rgb *= color;

    vec3 ambient = ambientLightColor * ambientLightIntensity;

    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(directionalLightPosition);
    float diff = max(dot(normal, lightDir), 0.0);

    vec4 shadowCoord = directionalLightShadowMatrix * vec4(vWorldPosition, 1.0);
    float shadow = getShadow(shadowCoord, lightDir, normal);

    vec3 directional = directionalLightColor * directionalLightIntensity * diff * (1.0 - shadow);

    vec3 lightning = ambient + directional;

    vec3 dayColor = updColor;

    float grayscale = dot(updColor, vec3(0.299, 0.587, 0.114));
    vec3 nightColor = vec3(grayscale);

    float blendFactor = smoothstep(0.3, 0.7, timeFactor);
    vec3 newColor = mix(nightColor, dayColor, blendFactor);

    vec4 finalColor = texColor;
    finalColor = vec4(newColor * lightning, 1.0);

    gl_FragColor = finalColor;
}