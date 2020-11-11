function clear(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function initProgram(gl, vsSource, fsSource) {
    const vertShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Link failed: ' + gl.getProgramInfoLog(program));
        console.error('vertex shader info-log: ' + gl.getShaderInfoLog(vertShader));
        console.error('fragment shader info-log: ' + gl.getShaderInfoLog(fragShader));
        return null;
    }

    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    
    return program;
}

function initBuffers(gl, programInfo) {
    const program = initProgram(gl, programInfo.vertexShader, programInfo.fragmentShader);
    programInfo.program = program;
    const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    // indices
    {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(programInfo.indices), gl.STATIC_DRAW);
    }
    // other attributes
    for (let i = 0; i < numAttribs; i++) {
        const attribInfo = gl.getActiveAttrib(program, i);
        if (!attribInfo) {
            break;
        }
        let name = attribInfo.name;
        if (name.substr(-3) === '[0]') {
            name = name.substr(0, name.length - 3);
        }
        const buffer = gl.createBuffer();
        const location = gl.getAttribLocation(program, name);
        const attributes = programInfo.attributes[name];
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attributes.buffer), attributes.renderType || gl.STATIC_DRAW);
        gl.vertexAttribPointer(location, attributes.numComponents, attributes.type, false, 0, 0);
        gl.enableVertexAttribArray(location);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}

function initVAO(gl, exts, programInfo) {
    const vao = exts.vao.createVertexArrayOES();
    exts.vao.bindVertexArrayOES(vao);
    initBuffers(gl, programInfo);
    programInfo.vao = vao;
    exts.vao.bindVertexArrayOES(null);
}

function getBindPointForSamplerType(type) {
    if (type === gl.SAMPLER_2D) {
        return gl.TEXTURE_2D;        
    }
    if (type === gl.SAMPLER_CUBE) {
        return gl.TEXTURE_CUBE_MAP;  
    }
}

function getUniformSetter(gl, program, uniformInfo) {
    const location = gl.getUniformLocation(program, uniformInfo.name);
    const type = uniformInfo.type;
    // Check if this uniform is an array
    const isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) === '[0]');
    if (type === gl.FLOAT && isArray) {
        return function(v) {
            gl.uniform1fv(location, v);
        };
    }
    if (type === gl.FLOAT) {
        return function(v) {
            gl.uniform1f(location, v);
        };
    }
    if (type === gl.FLOAT_VEC2) {
        return function(v) {
            gl.uniform2fv(location, v);
        };
    }
    if (type === gl.FLOAT_VEC3) {
        return function(v) {
            gl.uniform3fv(location, v);
        };
    }
    if (type === gl.FLOAT_VEC4) {
        return function(v) {
            gl.uniform4fv(location, v);
        };
    }
    if (type === gl.INT && isArray) {
        return function(v) {
            gl.uniform1iv(location, v);
        };
    }
    if (type === gl.INT) {
        return function(v) {
            gl.uniform1i(location, v);
        };
    }
    if (type === gl.INT_VEC2) {
        return function(v) {
            gl.uniform2iv(location, v);
        };
    }
    if (type === gl.INT_VEC3) {
        return function(v) {
            gl.uniform3iv(location, v);
        };
    }
    if (type === gl.INT_VEC4) {
        return function(v) {
            gl.uniform4iv(location, v);
        };
    }
    if (type === gl.BOOL) {
        return function(v) {
            gl.uniform1i(location, v);
        };
    }
    if (type === gl.BOOL_VEC2) {
        return function(v) {
            gl.uniform2iv(location, v);
        };
    }
    if (type === gl.BOOL_VEC3) {
        return function(v) {
            gl.uniform3iv(location, v);
        };
    }
    if (type === gl.BOOL_VEC4) {
        return function(v) {
            gl.uniform4iv(location, v);
        };
    }
    if (type === gl.FLOAT_MAT2) {
        return function(v) {
            gl.uniformMatrix2fv(location, false, v);
        };
    }
    if (type === gl.FLOAT_MAT3) {
        return function(v) {
            gl.uniformMatrix3fv(location, false, v);
        };
    }
    if (type === gl.FLOAT_MAT4) {
        return function(v) {
            gl.uniformMatrix4fv(location, false, v);
        };
    }
    if ((type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) && isArray) {
        const units = [];
        for (let i = 0; i < uniformInfo.size; i++) {
            units.push(textureUnit++);
        }
        return function(bindPoint, units) {
            return function(textures) {
                gl.uniform1iv(location, units);
                for (let i = 0; i < textures.length; i++) {
                    gl.activeTexture(gl.TEXTURE0 + units[i]);
                    gl.bindTexture(bindPoint, textures[i]);
                }
            };
        }(getBindPointForSamplerType(type), units);
    }
    if (type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) {
        return function(bindPoint, unit) {
            return function(texture) {
                gl.uniform1i(location, unit);
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(bindPoint, texture);
            };
        }(getBindPointForSamplerType(type), textureUnit++);
    }
};

function getUniformsSetters(gl, programInfo) {
    textureUnit = 0;
    const program = programInfo.program;
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    let uniformsSetter = [];
    for (let i = 0; i < numUniforms; i++) {
        const uniformInfo = gl.getActiveUniform(program, i);
        if (!uniformInfo) {
            break;
        }
        let name = uniformInfo.name;
        if (name.substr(-3) === '[0]') {
            name = name.substr(0, name.length - 3);
        }
        const setter = getUniformSetter(gl, program, uniformInfo);
        uniformsSetter[name] = setter;
    }
    programInfo.uniformsSetter = uniformsSetter;
};

function setUniforms(gl, programInfo) {
    if (!programInfo.uniformsSetter) {
        getUniformsSetters(gl, programInfo);
    }
    const uniformsSetter = programInfo.uniformsSetter;
    const uniforms = programInfo.uniforms;
    for (var i in uniformsSetter) {
        if (uniformsSetter.hasOwnProperty(i)) {
            uniformsSetter[i](uniforms[i]);
        }
    }
};

function render(gl, exts, programInfo, attributes = null) {
    exts.vao.bindVertexArrayOES(programInfo.vao);
    if (attributes) {
        const program = programInfo.program;
        for (var i in attributes) {
            if (attributes.hasOwnProperty(i)) {
                const buffer = gl.createBuffer();
                const location = gl.getAttribLocation(program, name);
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attributes[i].buffer), gl.STATIC_DRAW);
                gl.vertexAttribPointer(location, attributes[i].numComponents, attributes[i].type, false, 0, 0);
                gl.enableVertexAttribArray(location);
            }
        }
    }
    gl.useProgram(programInfo.program);
    setUniforms(gl, programInfo);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.drawElements(gl.TRIANGLES, programInfo.indices.length, gl.UNSIGNED_SHORT, 0);
    exts.vao.bindVertexArrayOES(null);
}