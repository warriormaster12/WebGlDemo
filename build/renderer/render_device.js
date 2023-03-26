export class Pipeline {
    constructor() {
        this.v_source = '';
        this.f_source = '';
        this.attributes = {};
        this.uniforms = {};
    }
    load_shader(device, type, source) {
        const SHADER = device.gl.createShader(type);
        device.gl.shaderSource(SHADER, source);
        device.gl.compileShader(SHADER);
        if (!device.gl.getShaderParameter(SHADER, device.gl.COMPILE_STATUS)) {
            alert(`An error occurred compiling the shaders: ${device.gl.getShaderInfoLog(SHADER)}`);
            device.gl.deleteShader(SHADER);
            return '';
        }
        return SHADER;
    }
    add_vertex_attribute(device, key, value) {
        this.attributes[key] = device.gl.getAttribLocation(this.program, value);
    }
    add_uniform(device, key, value) {
        this.uniforms[key] = device.gl.getUniformLocation(this.program, value);
    }
    create_graphics_pipeline(device) {
        const V_SHADER = this.load_shader(device, device.gl.VERTEX_SHADER, this.v_source);
        const F_SHADER = this.load_shader(device, device.gl.FRAGMENT_SHADER, this.f_source);
        const PIPELINE = device.gl.createProgram();
        device.gl.attachShader(PIPELINE, V_SHADER);
        device.gl.attachShader(PIPELINE, F_SHADER);
        device.gl.linkProgram(PIPELINE);
        if (!device.gl.getProgramParameter(PIPELINE, device.gl.LINK_STATUS)) {
            alert(`Unable to initialize the shader program: ${device.gl.getProgramInfoLog(PIPELINE)}`);
        }
        else {
            this.program = PIPELINE;
        }
    }
    bind_pipeline(device) {
        device.gl.useProgram(this.program);
    }
}
export class RenderBuffer {
    constructor(device, componentCount, data, indicies = false) {
        this.componentCount = 0;
        this.data = [];
        this.indicies = false;
        const GL = device.gl;
        this.buffer = GL.createBuffer();
        this.componentCount = componentCount;
        this.data = data;
        this.indicies = indicies;
        if (indicies) {
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.buffer);
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), GL.STATIC_DRAW);
        }
        else {
            GL.bindBuffer(GL.ARRAY_BUFFER, this.buffer);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(data), GL.STATIC_DRAW);
        }
    }
    bind_buffer(device, attribute) {
        const GL = device.gl;
        const numComponents = this.componentCount;
        const type = GL.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        GL.bindBuffer(GL.ARRAY_BUFFER, this.buffer);
        GL.vertexAttribPointer(attribute, numComponents, type, normalize, stride, offset);
        GL.enableVertexAttribArray(attribute);
    }
    bind_index_buffer(device) {
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this.buffer);
    }
    get_buffer_data() {
        return { componentCount: this.componentCount, data: this.data };
    }
}
export class RenderPass {
    constructor() {
        this.info = {
            depth: false,
            color: false,
            depth_value: 1.0,
            color_value: [0.0, 0.0, 0.0, 1.0]
        };
    }
    begin_renderpass(device) {
        const GL = device.gl;
        GL.clearColor(this.info.color_value[0], this.info.color_value[1], this.info.color_value[2], this.info.color_value[3]);
        let buffers = null;
        if (this.info.color) {
            buffers |= GL.COLOR_BUFFER_BIT;
        }
        if (this.info.depth) {
            buffers |= GL.DEPTH_BUFFER_BIT;
            GL.clearDepth(this.info.depth_value);
            GL.enable(GL.DEPTH_TEST);
            GL.depthFunc(GL.LEQUAL);
        }
        if (buffers != null) {
            GL.clear(buffers);
            return true;
        }
        else {
            console.log("skipping creation of renderpass", this);
            return false;
        }
    }
}
export class RenderDevice {
    constructor() {
        this.gl = null;
    }
    init_renderer() {
        const CANVAS = document.querySelector('#glcanvas');
        if (!(CANVAS instanceof HTMLCanvasElement)) {
            throw new Error('No html canvas element.');
        }
        // WebGL rendering context
        this.gl = CANVAS.getContext('webgl2');
        if (!this.gl) {
            throw new Error('Unable to initialize WebGL.');
        }
    }
    get_canvas_resolution() {
        return {
            width: this.gl.canvas.clientWidth,
            height: this.gl.canvas.clientHeight
        };
    }
    draw(offset, vertexCount) {
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);
    }
    draw_indexed(offset, vertexCount) {
        const type = this.gl.UNSIGNED_SHORT;
        this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
    }
}
