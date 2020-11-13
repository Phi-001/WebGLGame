import { levels } from "./Modules/data.js";
import { mat4 } from "./Modules/matrix.js";
import { clear, initVAO, render } from "./Modules/webgl-helper.js";
import { mainvs, mainfs } from "./Modules/shaders.js";

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

const availableExtensions = gl.getSupportedExtensions();

const exts = {};

for (let i = 0; i < availableExtensions.length; i++) {
    const extensionName = availableExtensions[i];
    exts[extensionName.replace(/[A-Z]+_/g, "")] = gl.getExtension(extensionName);
}

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.FRONT);
gl.frontFace(gl.CW);
gl.enable(gl.DITHER);

clear(gl);

const fov = 70 * Math.PI / 180;
const aspect = canvas.clientWidth / canvas.clientHeight;
const zNear = 0.1;
const zFar= 10000.0;

const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

const programInfo = {
    vertexShader: mainvs,
    fragmentShader: mainfs,
    indices: levels[0].indices,
    attributes: {
        aVertexPosition: {
            buffer: levels[0].vertices,
            numComponents: 3,
            type: gl.FLOAT,
        },
        aVertexNormal: {
            buffer: levels[0].normals,
            numComponents: 3,
            type: gl.FLOAT,
        }
    },
    uniforms: {
        uProjectionMatrix: projectionMatrix,
        uModelViewMatrix: null,
        uLight: {
            position: [0.0, 0.0, 0.0],
            color: [1.0, 1.0, 1.0],
            constant: 1.0,
            linear: 0.7,
            quadratic: 1.8,
        },
    },
};

initVAO(gl, exts, programInfo);

const camera = {
    position: [0, 0, 0],
    dir: [0, 0, 0],
    yaw: 180,
    pitch: 0,
    stepSize: 0.1,
};

function constrain(x, e1, e2) {
    return Math.max(Math.min(x, e2), e1);
}

function radians(x) {
    return x * Math.PI / 180;
}

canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;

canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
});

canvas.addEventListener("mousemove", (e) => {
    camera.yaw = (camera.yaw + e.movementX / canvas.clientWidth * 20) % 360;
    camera.pitch = constrain(camera.pitch + e.movementY / canvas.clientHeight * 20, -90, 90);
    camera.dir[0] = Math.sin(radians(camera.yaw));
    camera.dir[2] = Math.cos(radians(camera.yaw));
});

const keys = [];

window.addEventListener("keydown", (e) => {
    const code = e.code;
    keys[code] = true;
});

window.addEventListener("keyup", (e) => {
    const code = e.code;
    keys[code] = false;
});

function draw() {
    if (keys["KeyW"]) {
        camera.position[0] -= camera.dir[0] * camera.stepSize;
        camera.position[2] += camera.dir[2] * camera.stepSize;
    }
    if (keys["KeyA"]) {
        camera.position[0] += camera.dir[2] * camera.stepSize;
        camera.position[2] += camera.dir[0] * camera.stepSize;
    }
    if (keys["KeyS"]) {
        camera.position[0] += camera.dir[0] * camera.stepSize;
        camera.position[2] -= camera.dir[2] * camera.stepSize;
    }
    if (keys["KeyD"]) {
        camera.position[0] -= camera.dir[2] * camera.stepSize;
        camera.position[2] -= camera.dir[0] * camera.stepSize;
    }
    if (keys["Space"]) {
        camera.position[1] -= camera.stepSize;
    }
    if (keys["ShiftLeft"]) { 
        camera.position[1] += camera.stepSize;
    }

    clear(gl);

    // set model view matrix
    const modelViewMatrix = mat4.create();
    mat4.rotateX(modelViewMatrix, modelViewMatrix, radians(camera.pitch));
    mat4.rotateY(modelViewMatrix, modelViewMatrix, radians(camera.yaw));
    mat4.translate(modelViewMatrix, modelViewMatrix, camera.position);
    programInfo.uniforms.uModelViewMatrix = modelViewMatrix;

    // render
    render(gl, exts, programInfo);
    requestAnimationFrame(draw);
}

requestAnimationFrame(draw);