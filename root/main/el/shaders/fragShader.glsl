precision highp float;

varying vec2 vUv;
varying vec3 vWorldPosition;
uniform float time;
uniform float timeFactor;

uniform sampler2D map;
uniform vec4 bounds;

uniform bool isObs;

void main() {
    //Bounds
    if(vWorldPosition.x < bounds.x || 
       vWorldPosition.x > bounds.y || 
       vWorldPosition.y < bounds.z || 
       vWorldPosition.y > bounds.w) {

        //discard;
    }
    
    vec4 texColor = texture2D(map, vUv);

    vec3 dayColor = texColor.rgb;

    float grayscale = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    vec3 nightColor = vec3(grayscale);

    float blendFactor = smoothstep(0.3, 0.7, timeFactor);
    vec3 color = mix(nightColor, dayColor, blendFactor);
    vec3 finalColor = color;

    //Obstacles
    if(isObs) {
        vec3 invertedColor = vec3(1.0) - color;
        float obsBlend = smoothstep(0.3, 0.7, timeFactor);
        finalColor = mix(invertedColor, color, obsBlend);
    }

    gl_FragColor = vec4(finalColor, texColor.a);
}