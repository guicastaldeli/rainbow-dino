precision highp float;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;
uniform float time;
uniform float timeFactor;

uniform sampler2D map;
uniform vec4 bounds;

uniform bool isObs;
uniform bool isCloud;

uniform float opacity;

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

void main() {    
    vec4 texColor = texture2D(map, vUv);
    float alpha = texColor.a;

    vec3 dayColor = texColor.rgb;

    float grayscale = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    vec3 nightColor = vec3(grayscale);

    float blendFactor = smoothstep(0.3, 0.7, timeFactor);
    vec3 color = mix(nightColor, dayColor, blendFactor);
    vec3 finalColor = color;

    vec3 ambient = ambientLightColor * ambientLightIntensity;

    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(directionalLightPosition);
    float diff = max(dot(normal, lightDir), 0.0);

    vec4 shadowCoord = directionalLightShadowMatrix * vec4(vWorldPosition, 1.0);
    float shadow = getShadow(shadowCoord, lightDir, normal);

    vec3 directional = directionalLightColor * directionalLightIntensity * diff * (1.0 - shadow);

    vec3 lightning = ambient + directional;
    finalColor *= lightning;

    //Bounds
    if(!isCloud) {
        if(vWorldPosition.x < bounds.x ||
            vWorldPosition.x > bounds.y || 
            vWorldPosition.y < bounds.z || 
            vWorldPosition.y > bounds.w) {

            discard;
        }
    } else {
        alpha *= mix(0.7, 0.85, timeFactor);

        if(vWorldPosition.x < bounds.x * 1.003 || 
            vWorldPosition.x > bounds.y ||
            vWorldPosition.y < bounds.z || 
            vWorldPosition.y > bounds.w) {

            discard;
        }
    }

    //Obstacles
    if(isObs) {
        vec3 invertedColor = vec3(1.0) - color;
        float obsBlend = smoothstep(0.3, 0.7, timeFactor);
        vec3 obsColor = mix(invertedColor, color, obsBlend);

        finalColor = obsColor * lightning;
    }

    gl_FragColor = vec4(finalColor, alpha);
}