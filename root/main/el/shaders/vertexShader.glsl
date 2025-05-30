varying vec2 vUv;
uniform vec4 clippingPlanes[6];

void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    for(int i = 0; i < 6; i++) {
        vec4 plane = clippingPlanes[i];

        if(i >= int(plane.w)) break;
        if(dot(worldPosition.xyz, plane.xyz), plane.w < 0.0) {
            gl_Position = vec4(0.0);
            return;
        }
    }
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}