const camera = {
    position: [0, 0, 0],
    dir: [0, 0, 0],
    yaw: 0,
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
    const keyCode = e.keyCode;
    keys[keyCode] = true;
});

window.addEventListener("keyup", (e) => {
    const keyCode = e.keyCode;
    keys[keyCode] = false;
});

function draw() {
    if (keys["W".charCodeAt(0)]) {
        camera.position[0] -= camera.dir[0] * camera.stepSize;
        camera.position[2] += camera.dir[2] * camera.stepSize;
    }
    if (keys["A".charCodeAt(0)]) {
        camera.position[0] += camera.dir[2] * camera.stepSize;
        camera.position[2] += camera.dir[0] * camera.stepSize;
    }
    if (keys["S".charCodeAt(0)]) {
        camera.position[0] += camera.dir[0] * camera.stepSize;
        camera.position[2] -= camera.dir[2] * camera.stepSize;
    }
    if (keys["D".charCodeAt(0)]) {
        camera.position[0] -= camera.dir[2] * camera.stepSize;
        camera.position[2] -= camera.dir[0] * camera.stepSize;
    }
    if (keys[" ".charCodeAt(0)]) {
        camera.position[1] -= camera.stepSize;
    }
    if (keys[16]) { // if shift is being pressed
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