precision highp float;

uniform sampler2D map;
varying vec2 vUv;

uniform vec3 defaultColor;
uniform vec3 rColor;
uniform vec2 rUvMin;
uniform vec2 rUvMax;

void main() {
    vec4 texColor = texture2D(map, vUv);
    
    if(vUv.x > rUvMin.x && vUv.x < rUvMax.x &&
    vUv.y > rUvMin.y && vUv.y < rUvMax.y) {
        texColor.rgb;      
    } else {
        texColor.rgb *= rColor;
    }

    gl_FragColor = texColor;
}