const canvas = document.getElementById("gl");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const glArgs = {
    preserveDrawingBuffer : true, 
    failIfMajorPerformanceCaveat : false
};
const gl = canvas.getContext("webgl", glArgs) || canvas.getContext("experimental-webgl", glArgs);

if (!gl) {
    alert("WebGL not supported. Try https://get.webgl.org");
}

const exts = {
    instance: gl.getExtension('ANGLE_instanced_arrays') || gl.getExtension('MOZ_ANGLE_instanced_arrays') || gl.getExtension('WEBKIT_ANGLE_instanced_arrays'),
    vao: gl.getExtension('OES_vertex_array_object') || gl.getExtension('MOZ_OES_vertex_array_object') || gl.getExtension('WEBKIT_OES_vertex_array_object'),
};

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.FRONT);
gl.frontFace(gl.CW);

clear(gl);

const fov = 100 * Math.PI / 180;
const aspect = canvas.clientWidth / canvas.clientHeight;
const zNear = 0.1;
const zFar= 100.0;

const ang = Math.tan(fov / 2 * Math.PI / 180);
const projectionMatrix = [
    0.5 / ang, 0,                  0,                                    0,
    0,         0.5 * aspect / ang, 0,                                    0, 
    0,         0,                  -(zFar + zNear) / (zFar - zNear),    -1,
    0,         0,                  (-2 * zFar * zNear) / (zFar - zNear), 0,
];

const mainvs = `
attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
`;

const mainfs = `
void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const programInfo = {
    vertexShader: mainvs,
    fragmentShader: mainfs,
    indices: levels[0].indices,
    attributes: {
        aVertexPosition: {
            buffer: levels[0].vertices,
            numComponents: 2,
            type: gl.FLOAT,
        }
    },
    uniforms: {
        uProjectionMatrix: projectionMatrix,
        uModelViewMatrix: null,
    },
};

initVAO(gl, exts, programInfo);

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
})