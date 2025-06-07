precision highp float;

varying vec2 vUv;
varying vec3 vWorldPosition;
uniform float time;
uniform float timeFactor;

uniform sampler2D map;
uniform vec4 bounds;

uniform bool isObs;
uniform bool isCloud;

uniform float opacity;

uniform vec3 ambientLightColor;
uniform float ambientLightIntensity;

uniform vec3 directionalLightColor;
uniform float directionalLightIntensity;
uniform vec3 directionalLightPosition;

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

    vec3 normal = vec3(0.0, 0.0, 1.0);
    float diff = max(dot(normal, directionalLightPosition), 0.0);
    vec3 directional = directionalLightColor * directionalLightIntensity * diff;

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
        finalColor = mix(invertedColor, color, obsBlend);
    }

    gl_FragColor = vec4(finalColor, alpha);
}