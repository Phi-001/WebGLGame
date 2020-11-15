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

function atLeastTwo(a, b, c) {
    return a ? (b || c) : (b && c);
}

function collision(camera, level, dir) {
    const normals = level.normals;
    const vertices = level.vertices;
    const vx = dir[0] * camera.stepSize;
    const vy = dir[1] * camera.stepSize;
    const vz = dir[2] * camera.stepSize;
    const x = camera.position[0];
    const y = camera.position[1];
    const z = camera.position[2];
    for (let i = 0; i < vertices.length; i += 12) {
        const normalx = normals[i];
        const normaly = normals[i + 1];
        const normalz = normals[i + 2];
        const d = -(vertices[i] * normalx + vertices[i + 1] * normaly - vertices[i + 2] * normalz);
        const t = -(normalx * x + normaly * y + normalz * z + d - 0.1) / (normalx * vx + normaly * vy + normalz * vz);
        if (t < 0 || t >= 1 || !t) {
            continue;
        }
        const xmax = Math.max(vertices[i], vertices[i + 3], vertices[i + 6]);
        const ymax = Math.max(vertices[i + 1], vertices[i + 4], vertices[i + 7]);
        const zmax = Math.max(vertices[i + 2], vertices[i + 5], vertices[i + 8]);
        const xmin = Math.min(vertices[i], vertices[i + 3], vertices[i + 6]);
        const ymin = Math.min(vertices[i + 1], vertices[i + 4], vertices[i + 7]);
        const zmin = Math.min(vertices[i + 2], vertices[i + 5], vertices[i + 8]);
        const newx = x + t * vx + Number.EPSILON * normalx;
        const newy = y + t * vy + Number.EPSILON * normaly;
        const newz = z + t * vz + Number.EPSILON * normalz;
        if (atLeastTwo(newx <= xmax && newx >= xmin, newz >= -zmax && newz <= -zmin, newy <= ymax && newy >= ymin)) {
            return [newx, newy, newz];
        }
    }
    return [x + vx, y + vy, z + vz];
}

function draw() {
    if (keys["KeyW"]) {
        const newPos = collision(camera, levels[0], [-camera.dir[0], 0, camera.dir[2]]);
        camera.position[0] = newPos[0];
        camera.position[1] = newPos[1];
        camera.position[2] = newPos[2];
    }
    if (keys["KeyA"]) {
        const newPos = collision(camera, levels[0], [camera.dir[2], 0, camera.dir[0]]);
        camera.position[0] = newPos[0];
        camera.position[1] = newPos[1];
        camera.position[2] = newPos[2];
    }
    if (keys["KeyS"]) {
        const newPos = collision(camera, levels[0], [camera.dir[0], 0, -camera.dir[2]]);
        camera.position[0] = newPos[0];
        camera.position[1] = newPos[1];
        camera.position[2] = newPos[2];
    }
    if (keys["KeyD"]) {
        const newPos = collision(camera, levels[0], [-camera.dir[2], 0, -camera.dir[0]]);
        camera.position[0] = newPos[0];
        camera.position[1] = newPos[1];
        camera.position[2] = newPos[2];
    }
    if (keys["Space"] && player.onGround) {
        const newPos = collision(camera, levels[0], [0, -5, 0]);
        camera.position[0] = newPos[0];
        camera.position[1] = newPos[1];
        camera.position[2] = newPos[2];
        player.onGround = false;
    }
    if (keys["ShiftLeft"]) { 
        const newPos = collision(camera, levels[0], [0, 1, 0]);
        camera.position[0] = newPos[0];
        camera.position[1] = newPos[1];
        camera.position[2] = newPos[2];
    }

    const gravity = collision(camera, levels[0], [0, 0.2, 0]);
    if (camera.position[1] === gravity[1]) {
        player.onGround = true;
    } else {
        player.onGround = false;
    }
    camera.position[0] = gravity[0];
    camera.position[1] = gravity[1];
    camera.position[2] = gravity[2];

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