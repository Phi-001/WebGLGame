import { levels } from "./Modules/data.js";
import { mat4 } from "./Modules/matrix.js";
import { clear, initVAO, render } from "./Modules/webgl-helper.js";
import { mainvs, mainfs } from "./Modules/shaders.js";

const canvas = document.getElementById("gl");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

if (!window.WebGLRenderingContext) {
    alert("WebGL not supported. Try https://get.webgl.org");
}

const glArgs = {
    preserveDrawingBuffer : true, 
    failIfMajorPerformanceCaveat : false
};
const gl = canvas.getContext("webgl", glArgs) || canvas.getContext("experimental-webgl", glArgs);

if (!gl) {
    alert("There is problem with WebGL. Try https://get.webgl.org/troubleshooting/");
}

const availableExtensions = gl.getSupportedExtensions();

const exts = {};

for (let i = 0; i < availableExtensions.length; i++) {
    const extensionName = availableExtensions[i];
    exts[extensionName.replace(/[A-Z]+_/g, "")] = gl.getExtension(extensionName);
}

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.GREATER);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.FRONT);
gl.frontFace(gl.CW);

clear(gl);

const fov = 70 * Math.PI / 180;
let aspect = gl.canvas.width / gl.canvas.height;
const zNear = 1e-4;
const zFar= 1e4;

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
        uLights: levels[0].lights,
        ambient: [0.1, 0.1, 0.1],
    },
};

initVAO(gl, exts, programInfo);

const camera = {
    position: [0, 0.7, 0],
    dir: [0, 0, 0],
    yaw: 180,
    pitch: 0,
    stepSize: 0.1,
};

const player = {
    height: 0.7,
    onGround: true,
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

function collision(camera, level, dir) {
    let x = camera.position[0] + dir[0] * camera.stepSize;
    let y = camera.position[1] + dir[1] * camera.stepSize;
    let z = camera.position[2] + dir[2] * camera.stepSize;
    for (let i = 0; i < level.length; i += 12) {
        const xmax = Math.max(level[i    ], level[i + 3], level[i + 6]),
              ymax = Math.max(level[i + 1], level[i + 4], level[i + 7]),
              zmax = Math.max(level[i + 2], level[i + 5], level[i + 8]),
              xmin = Math.min(level[i    ], level[i + 3], level[i + 6]),
              ymin = Math.min(level[i + 1], level[i + 4], level[i + 7]),
              zmin = Math.min(level[i + 2], level[i + 5], level[i + 8]);
        if (level[i] === level[i + 3] && level[i + 3] === level[i + 6] && y < ymax && y > ymin && z > -zmax && z < -zmin) {
            const py = level[i + 4] - level[i + 1],
                  qy = level[i + 7] - level[i + 1],
                  pz = level[i + 5] - level[i + 2],
                  qz = level[i + 8] - level[i + 2],
                  sign = py * qz - pz * qy;
            if (sign < 0) {
                x = Math.max(x, level[i] + 0.1);
            } else {
                x = Math.min(x, level[i] - 0.1);
            }
        } else if (level[i + 1] === level[i + 4] && level[i + 4] === level[i + 7] && x < xmax && x > xmin && z > -zmax && z < -zmin) {
            const px = level[i + 3] - level[i],
                  qx = level[i + 6] - level[i],
                  pz = level[i + 5] - level[i + 2],
                  qz = level[i + 8] - level[i + 2],
                  sign = pz * qx - px * qz;
            if (sign < 0) {
                y = Math.max(y, level[i + 1] + 0.1);
            } else {
                y = Math.min(y, level[i + 1] - 0.1 - player.height);
            }
        } else if (level[i + 2] === level[i + 5] && level[i + 5] === level[i + 8] && x < xmax && x > xmin && y < ymax && y > ymin) {
            const py = level[i + 3] - level[i],
                  qy = level[i + 6] - level[i],
                  pz = level[i + 4] - level[i + 1],
                  qz = level[i + 7] - level[i + 1],
                  sign = py * qz - pz * qy;
            if (sign < 0) {
                z = Math.min(z, -level[i + 2] - 0.1);
            } else {
                z = Math.max(z, -level[i + 2] + 0.1);
            }
        }
    }
    return [x, y, z];
}

function draw() {
    if (keys["KeyW"]) {
        const newPos = collision(camera, levels[0].vertices, [-camera.dir[0], 0, camera.dir[2]]);
        camera.position[0] = newPos[0];
        camera.position[2] = newPos[2];
    }
    if (keys["KeyA"]) {
        const newPos = collision(camera, levels[0].vertices, [camera.dir[2], 0, camera.dir[0]]);
        camera.position[0] = newPos[0];
        camera.position[2] = newPos[2];
    }
    if (keys["KeyS"]) {
        const newPos = collision(camera, levels[0].vertices, [camera.dir[0], 0, -camera.dir[2]]);
        camera.position[0] = newPos[0];
        camera.position[2] = newPos[2];
    }
    if (keys["KeyD"]) {
        const newPos = collision(camera, levels[0].vertices, [-camera.dir[2], 0, -camera.dir[0]]);
        camera.position[0] = newPos[0];
        camera.position[2] = newPos[2];
    }
    if (keys["Space"] && player.onGround) {
        const newPos = collision(camera, levels[0].vertices, [0, -5, 0]);
        camera.position[1] = newPos[1];
        player.onGround = false;
    }
    if (keys["ShiftLeft"]) { 
        const newPos = collision(camera, levels[0].vertices, [0, 1, 0]);
        camera.position[1] = newPos[1];
    }

    const gravity = collision(camera, levels[0].vertices, [0, 0.2, 0]);
    if (camera.position[1] === gravity[1]) {
        player.onGround = true;
    } else {
        camera.position[1] = gravity[1];
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

window.onresize = () => {
    gl.canvas.width = window.innerWidth;
    gl.canvas.height = window.innerHeight;
    mat4.changePerspective(programInfo.uniforms.uProjectionMatrix, programInfo.uniforms.uProjectionMatrix, aspect, gl.canvas.width / gl.canvas.height);
    aspect = gl.canvas.width / gl.canvas.height;
};