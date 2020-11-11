const camera = {
    position: [0, 0, -100],
};

let modelViewMatrix = mat4.create();
mat4.translate(modelViewMatrix, modelViewMatrix, camera.position);
programInfo.uniforms.uModelViewMatrix = modelViewMatrix;

render(gl, exts, programInfo);