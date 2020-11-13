const mainvs = `
attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vNormal;
varying vec3 vFragPos;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vFragPos = aVertexPosition.xyz;
    vNormal = aVertexNormal;
}
`;

const mainfs = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

struct light {
    vec3 position;
    vec3 color;

    float constant;
    float linear;
    float quadratic;
};

uniform light uLight;

varying vec3 vFragPos;
varying vec3 vNormal;

void main() {
    vec3 lightDir = uLight.position - vFragPos;
    float distance = length(lightDir);
    float attenuation = 1.0 / (uLight.constant + uLight.linear * distance + uLight.quadratic * (distance * distance));
    vec3 ambient = vec3(0.3);
    vec3 lighting = ((max(dot(normalize(lightDir), normalize(vNormal)), 0.0) * attenuation) * uLight.color + ambient);
    gl_FragColor = vec4(vec3(1.0) * lighting, 1.0);
}
`;

export { mainvs, mainfs };