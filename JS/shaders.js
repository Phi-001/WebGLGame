const mainvs = `
attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vLighting;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    // lighting
    vec3 ambientLight = vec3(0.3, 0.3, 0.3);
    vec3 directionalLightColor = vec3(1.0, 1.0, 1.0);
    vec3 directionalVector = normalize(vec3(0.3, 0.8, 0.75));

    float directional = max(dot(aVertexNormal.xyz, directionalVector), 0.0);
    vLighting = ambientLight + (directionalLightColor * directional);
}
`;

const mainfs = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

varying vec3 vLighting;

void main() {
    gl_FragColor = vec4(vec3(1.0) * vLighting, 1.0);
}
`;