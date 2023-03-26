export class Pipeline{
    v_source:string = '';
    f_source:string = '';
    attributes:{[key:string]:string} = {}
    uniforms:{[key:string]:string} = {}
    program:any;


    private load_shader(device: RenderDevice, type:any, source:string):WebGLShader{
        const SHADER:WebGLShader = device.gl.createShader(type);

        device.gl.shaderSource(SHADER, source);

        device.gl.compileShader(SHADER);

        if (!device.gl.getShaderParameter(SHADER, device.gl.COMPILE_STATUS)) {
            alert(
            `An error occurred compiling the shaders: ${device.gl.getShaderInfoLog(SHADER)}`
            );
            device.gl.deleteShader(SHADER);
            return '';
        }

        return SHADER;
    }
    add_vertex_attribute(device: RenderDevice, key:string,value:string){
        this.attributes[key] = device.gl.getAttribLocation(this.program, value);
    }
    add_uniform(device: RenderDevice, key:string,value:string){
        this.uniforms[key] = device.gl.getUniformLocation(this.program, value);
    }
    create_graphics_pipeline(device: RenderDevice):void{
        const V_SHADER = this.load_shader(device, device.gl.VERTEX_SHADER, this.v_source);
        const F_SHADER = this.load_shader(device, device.gl.FRAGMENT_SHADER, this.f_source);

        const PIPELINE:WebGLProgram = device.gl.createProgram();
        device.gl.attachShader(PIPELINE, V_SHADER);
        device.gl.attachShader(PIPELINE, F_SHADER);
        device.gl.linkProgram(PIPELINE);

        if (!device.gl.getProgramParameter(PIPELINE, device.gl.LINK_STATUS)) {
            alert(
            `Unable to initialize the shader program: ${device.gl.getProgramInfoLog(
                PIPELINE
            )}`
            );
        }else{
            this.program = PIPELINE;
        }
    }

    bind_pipeline(device:RenderDevice){
        device.gl.useProgram(this.program);
    }
}

export class RenderBuffer{
    private buffer:any;
    private componentCount:number = 0;
    private data:Array<number> = [];
    private indicies:boolean = false;
    constructor(device:RenderDevice,componentCount:number,data:Array<number>, indicies:boolean = false){
        const GL = (device.gl as WebGL2RenderingContext);
        this.buffer = GL.createBuffer();
        this.componentCount = componentCount;
        this.data = data;
        this.indicies = indicies;
        if(indicies){
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.buffer);
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), GL.STATIC_DRAW);
        }else{
            GL.bindBuffer(GL.ARRAY_BUFFER, this.buffer);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(data), GL.STATIC_DRAW);
        }
    }
    bind_buffer(device:RenderDevice,attribute:any){
        const GL = (device.gl as WebGL2RenderingContext);
        const numComponents = this.componentCount;
        const type = GL.FLOAT;
        const normalize = false; 
        const stride = 0; 
        const offset = 0;
        GL.bindBuffer(GL.ARRAY_BUFFER, this.buffer);
        GL.vertexAttribPointer(
            attribute,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        GL.enableVertexAttribArray(attribute);
    }

    bind_index_buffer(device:RenderDevice){
        device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this.buffer);
    }

    get_buffer_data(){
        return {componentCount: this.componentCount,data: this.data};
    }
}

export class RenderPass{
    info:any = {
        depth: false,
        color: false,
        depth_value: 1.0,
        color_value: [0.0, 0.0, 0.0, 1.0]
    };
    begin_renderpass(device:RenderDevice):boolean{
        const GL = (device.gl as WebGL2RenderingContext);
        GL.clearColor(this.info.color_value[0], 
            this.info.color_value[1], 
            this.info.color_value[2], 
            this.info.color_value[3]);
        let buffers:any = null;
        if(this.info.color){
            buffers |= GL.COLOR_BUFFER_BIT;
        }
        if(this.info.depth){
            buffers |= GL.DEPTH_BUFFER_BIT;
            GL.clearDepth(this.info.depth_value);
            GL.enable(GL.DEPTH_TEST); 
            GL.depthFunc(GL.LEQUAL);
        }
        if(buffers != null){
            GL.clear(buffers);
            return true;
        }else{
            console.log("skipping creation of renderpass", this);
            return false;
        }
    }
}

export class RenderDevice{
    gl:any = null;
    init_renderer():void{
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

    get_canvas_resolution():any{
        return {
            width: this.gl.canvas.clientWidth,
            height: this.gl.canvas.clientHeight
        };
    }

    draw(offset:number, vertexCount:number){
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);
    }
    
    draw_indexed(offset:number, vertexCount:number){
        const type = this.gl.UNSIGNED_SHORT;
        this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
    }
}