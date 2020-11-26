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

const COLLISION_EPSILON = 0.01;

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
    position: [0, -0.8, 0],
    dir: [0, 0, 0],
    yaw: 180,
    pitch: 0.01,
    stepSize: 0.1,
    acceleration: [0.0, 0.0, 0.0],
    velocity: [0.0, 0.0, 0.0],
};

const player = {
    height: 0.4,
    onGround: true,
};

function constrain(x, e1, e2) {
    return Math.max(Math.min(x, e2), e1);
}

function radians(x) {
    return x * Math.PI / 180;
}

function extractEdge(level) {
    const vertices = level.vertices;
    const normals = level.normals;
    const edges = [];
    for (let faceIndex = 0; faceIndex < vertices.length / 12; faceIndex++) {
        const i = faceIndex * 12;
        for (let j = 0; j < 4; j++) {
            const edgeIndex = j * 3;
            const nextEdgeIndex = (j + 1) % 3 * 3;
            const edge = [[vertices[i + edgeIndex], vertices[i + edgeIndex + 1], vertices[i + edgeIndex + 2]], 
                          [vertices[i + nextEdgeIndex], vertices[i + nextEdgeIndex + 1], vertices[i + nextEdgeIndex + 2]],
                          faceIndex];
            let isDifferent = true;
            let isNecessary = true;
            for (let k = 0; k < edges.length; k++) {
                const testEdge = edges[k];
                let isSame = true;
                for (let e = 0; e < 3; e++) {
                    if (testEdge[0][e] !== edge[0][e]) {
                        isSame = false;
                        break;
                    }
                }

                for (let e = 0; e < 3; e++) {
                    if (testEdge[1][e] !== edge[1][e]) {
                        isSame = false;
                        break;
                    }
                }

                if (isSame) {
                    isDifferent = false;
                    const otherFaceIndex = testEdge[2];
                    const faceNormal = [normals[faceIndex * 12], normals[faceIndex * 12 + 1], normals[faceIndex * 12 + 2]]; 
                    const otherFaceNormal = [normals[otherFaceIndex * 12], normals[otherFaceIndex * 12 + 1], normals[otherFaceIndex * 12 + 2]];
                    const edgeDirection = [edge[0][0] - edge[1][0], edge[0][1] - edge[1][1], edge[0][2] - edge[1][2]];
                    const perpendicular = [faceNormal[1] * edgeDirection[2] - faceNormal[2] * edgeDirection[1], faceNormal[2] * edgeDirection[0] - faceNormal[0] * edgeDirection[2], faceNormal[0] * edgeDirection[1] - faceNormal[1] * edgeDirection[0]];
                    const cosAngle = perpendicular[0] * otherFaceNormal[0] + perpendicular[1] * otherFaceNormal[1] + perpendicular[2] * otherFaceNormal[2];
                    if (cosAngle >= 0) {
                        isNecessary = false;
                    }
                    edges.splice(k, 1);
                    break;
                }
            }
            if (isDifferent && isNecessary) {
                edges.push(edge);
            }
        }
    }
    return edges;
}

canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;

canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
});

canvas.addEventListener("mousemove", (e) => {
    camera.yaw = (camera.yaw + e.movementX / canvas.clientWidth * 20) % 360;
    camera.pitch = constrain(camera.pitch + e.movementY / canvas.clientHeight * 20, -90, 90);
    camera.dir[0] = Math.sin(radians(camera.yaw));
    camera.dir[2] = -Math.cos(radians(camera.yaw));
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

function normalize(v) {
    const x = v[0];
    const y = v[1];
    const z = v[2];
    const length = Math.sqrt(x * x + y * y + z * z);
    v[0] /= length;
    v[1] /= length;
    v[2] /= length;
    return v;
}

function collision(position, level, dir, edges) {
    const normals = level.normals;
    const vertices = level.vertices;
    const vx = dir[0];
    const vy = dir[1];
    const vz = dir[2];
    const x = position[0];
    const y = position[1];
    const z = position[2];
    let x2 = x + vx;
    let y2 = y + vy;
    let z2 = z + vz;
    const r = 0.1;
    let intersect = false;

    // ray and face
    for (let i = 0; i < vertices.length; i += 12) {
        const normalx = normals[i];
        const normaly = normals[i + 1];
        const normalz = normals[i + 2];
        const d = -(vertices[i] * normalx + vertices[i + 1] * normaly + vertices[i + 2] * normalz) - r;
        const t = -(normalx * x + normaly * y + normalz * z + d) / (normalx * vx + normaly * vy + normalz * vz);
        if (t < 0 || t >= 1 || !t) {
            continue;
        }
        const xmax = Math.max(vertices[i    ], vertices[i + 3], vertices[i + 6]);
        const ymax = Math.max(vertices[i + 1], vertices[i + 4], vertices[i + 7]);
        const zmax = Math.max(vertices[i + 2], vertices[i + 5], vertices[i + 8]);
        const xmin = Math.min(vertices[i    ], vertices[i + 3], vertices[i + 6]);
        const ymin = Math.min(vertices[i + 1], vertices[i + 4], vertices[i + 7]);
        const zmin = Math.min(vertices[i + 2], vertices[i + 5], vertices[i + 8]);
        const newx = x + t * vx + COLLISION_EPSILON * normalx; 
        const newy = y + t * vy + COLLISION_EPSILON * normaly;
        const newz = z + t * vz + COLLISION_EPSILON * normalz;
        if (atLeastTwo(newx <= xmax && newx >= xmin, newy <= ymax && newy >= ymin, newz <= zmax && newz >= zmin)) {
            const slide = (x2 - newx) * normalx + (y2 - newy) * normaly + (z2 - newz) * normalz;
            const slidex = x2 - slide * normalx;
            const slidey = y2 - slide * normaly;
            const slidez = z2 - slide * normalz;
            const newPos =  collision([newx, newy, newz], level, [slidex - newx, slidey - newy, slidez - newz], 1, edges);
            x2 = newPos[0];
            y2 = newPos[1];
            z2 = newPos[2];
            intersect = true;
        }
    }

    if (intersect) {
        return [x2, y2, z2];
    }

    // ray and edge cylinder
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const vert1 = edge[0];
        const vert2 = edge[1];
        const A = [vert2[0] - vert1[0], vert2[1] - vert1[1], vert2[2] - vert1[2]];
        const S = [x - vert1[0], y - vert1[1], z - vert1[2]];
        const vDotA = vx * A[0] + vy * A[1] + vz * A[2];
        const SDotA = S[0] * A[0] + S[1] * A[1] + S[2] * A[2];
        const A2 = A[0] * A[0] + A[1] * A[1] + A[2] * A[2];
        const a = vx * vx + vy * vy + vz * vz - vDotA * vDotA / A2;
        const b = S[0] * vx + S[1] * vy + S[2] * vz - SDotA * vDotA / A2;
        const c = S[0] * S[0] + S[1] * S[1] + S[2] * S[2] - r * r - SDotA * SDotA / A2;
        const discriminent = b * b - a * c;
        if (discriminent <= 0) {
            continue;
        }
        const t = (-b - Math.sqrt(discriminent)) / a;
        if (t < 0 || t >= 1 || !t) {
            continue;
        }
        const interSection = [x + t * vx, y + t * vy, z + t * vz];
        const PminusE = [interSection[0] - vert1[0], interSection[1] - vert1[1], interSection[2] - vert1[2]];
        const PminusEDotA = PminusE[0] * A[0] + PminusE[1] * A[1] + PminusE[2] * A[2];
        const length = PminusEDotA / A2;
        const interSection2 = [vert1[0] + A[0] * length, vert1[1] + A[1] * length, vert1[2] + A[2] * length];
        const normal = [interSection[0] - interSection2[0], interSection[1] - interSection2[1], interSection[2] - interSection2[2]];
        normalize(normal);
        interSection[0] += COLLISION_EPSILON * normal[0];
        interSection[1] += COLLISION_EPSILON * normal[1];
        interSection[2] += COLLISION_EPSILON * normal[2];
        if (0 < PminusEDotA && PminusEDotA < A2) {
            const slide = (x2 - interSection[0]) * normal[0] + (y2 - interSection[1]) * normal[1] + (z2 - interSection[2]) * normal[2];
            const slidex = x2 - slide * normal[0];
            const slidey = y2 - slide * normal[1];
            const slidez = z2 - slide * normal[2];
            const newPos =  collision(interSection, level, [slidex - interSection[0], slidey - interSection[1], slidez - interSection[2]], 1, edges);
            x2 = newPos[0];
            y2 = newPos[1];
            z2 = newPos[2];
            intersect = true;
            break;
        }
    }

    // ray and cornor sphere

    return [x2, y2, z2];
}

function collidePortal(position, dir, portal) {
    const normal = portal.normal;
    const vertices = portal.vertices;
    const vx = dir[0];
    const vy = dir[1];
    const vz = dir[2];
    const x = position[0];
    const y = position[1];
    const z = position[2];
    const r = 0.1;
    const normalx = normal[0];
    const normaly = normal[1];
    const normalz = normal[2];
    const d = -(vertices[0] * normalx + vertices[1] * normaly + vertices[2] * normalz) - r;
    const t = -(normalx * x + normaly * y + normalz * z + d) / (normalx * vx + normaly * vy + normalz * vz);
    if (t < 0 || t >= 1 || !t) {
        return false;
    }
    const xmax = Math.max(vertices[0], vertices[3], vertices[6]);
    const ymax = Math.max(vertices[1], vertices[4], vertices[7]);
    const zmax = Math.max(vertices[2], vertices[5], vertices[8]);
    const xmin = Math.min(vertices[0], vertices[3], vertices[6]);
    const ymin = Math.min(vertices[1], vertices[4], vertices[7]);
    const zmin = Math.min(vertices[2], vertices[5], vertices[8]);
    const newx = x + t * vx; 
    const newy = y + t * vy;
    const newz = z + t * vz;
    if (atLeastTwo(newx <= xmax && newx >= xmin, newy <= ymax && newy >= ymin, newz <= zmax && newz >= zmin)) {
        return true;
    }
    return false;
}

const edges = extractEdge(levels[0]);
function draw() {
    if (keys["KeyW"]) {
        camera.acceleration[0] += camera.dir[0];
        camera.acceleration[1] += 0;
        camera.acceleration[2] += camera.dir[2];
    }
    if (keys["KeyA"]) {
        camera.acceleration[0] += camera.dir[2];
        camera.acceleration[1] += 0;
        camera.acceleration[2] -= camera.dir[0];
    }
    if (keys["KeyS"]) {
        camera.acceleration[0] -= camera.dir[0];
        camera.acceleration[1] -= 0;
        camera.acceleration[2] -= camera.dir[2];
    }
    if (keys["KeyD"]) {
        camera.acceleration[0] -= camera.dir[2];
        camera.acceleration[1] += 0;
        camera.acceleration[2] += camera.dir[0];
    }
    if (keys["Space"]) {
        camera.acceleration[0] += 0;
        camera.acceleration[1] += 2.5;
        camera.acceleration[2] += 0;
    }

    const newPos = collision(camera.position, levels[0], [camera.velocity[0], camera.velocity[1] - 0.2, camera.velocity[2]], edges);
    for (let i = 0; i < levels[0].portals.length; i++) {
        const portal = levels[0].portals[i];
        if(collidePortal(camera.position, camera.velocity, portal)) {
            newPos[0] -= portal.position[0];
            newPos[1] -= portal.position[1];
            newPos[2] -= portal.position[2];
            newPos[0] += portal.to[0];
            newPos[1] += portal.to[1];
            newPos[2] += portal.to[2];
            break;
        }
    }
    camera.position[0] = newPos[0];
    camera.position[1] = newPos[1];
    camera.position[2] = newPos[2];

    camera.velocity[0] += camera.acceleration[0];
    camera.velocity[1] += camera.acceleration[1];
    camera.velocity[2] += camera.acceleration[2];

    camera.acceleration[0] = 0;
    camera.acceleration[1] = 0;
    camera.acceleration[2] = 0;

    camera.velocity[0] /= 10;
    camera.velocity[1] /= 10;
    camera.velocity[2] /= 10;

    clear(gl);

    // set model view matrix
    const modelViewMatrix = mat4.create();
    mat4.rotateX(modelViewMatrix, modelViewMatrix, radians(camera.pitch));
    mat4.rotateY(modelViewMatrix, modelViewMatrix, radians(camera.yaw));
    mat4.translate(modelViewMatrix, modelViewMatrix, [-camera.position[0], -camera.position[1] - player.height, -camera.position[2]]);
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