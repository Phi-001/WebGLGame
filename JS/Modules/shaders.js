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

struct pointLight {
    vec3 position;
    vec3 color;

    float constant;
    float linear;
    float quadratic;
};

struct spotLight {
    vec3 position;
    vec3 direction;
    float cutOff;
    float outerCutOff;

    vec3 color;

    float constant;
    float linear;
    float quadratic;
};

uniform spotLight uLights[25];
uniform vec3 ambient;
uniform int numLights;

varying vec3 vFragPos;
varying vec3 vNormal;

void main() {
    vec3 lighting = vec3(0.0);

    for (int i = 0; i < 25; i++) {
        if (all(equal(uLights[i].color, vec3(0.0)))) {
            break;
        }
        vec3 lightDir = normalize(uLights[i].position - vFragPos);

        // diffuse
        float diffuse = max(dot(lightDir, normalize(vNormal)), 0.0);

        // spotlight
        float theta = dot(lightDir, normalize(-uLights[i].direction));
        float epsilon = uLights[i].cutOff - uLights[i].outerCutOff;
        float intensity = clamp((theta - uLights[i].outerCutOff) / epsilon, 0.0, 1.0);
        diffuse *= intensity;

        // attenuation
        float distance = length(uLights[i].position - vFragPos);
        float attenuation = 1.0 / (uLights[i].constant + uLights[i].linear * distance + uLights[i].quadratic * (distance * distance));

        lighting += (diffuse * attenuation) * uLights[i].color;
    }

    lighting += ambient;

    gl_FragColor = vec4(vec3(1.0) * lighting, 1.0);
}
`;

export { mainvs, mainfs };