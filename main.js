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


