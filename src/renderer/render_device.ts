export class Pipeline{
    v_source:string = '';
    f_source:string = '';
    attributes:{[key:string]:number} = {}
    uniforms:{[key:string]:WebGLUniformLocation | null} = {}
    program?:WebGLProgram | null;


    private load_shader(device: RenderDevice, type:number, source:string):WebGLShader | null{
        if(device.gl){
            const shader:WebGLShader | null = device.gl.createShader(type);

            if(shader){
                device.gl.shaderSource(shader, source);

                device.gl.compileShader(shader);

                if (!device.gl.getShaderParameter(shader, device.gl.COMPILE_STATUS)) {
                    alert(
                    `An error occurred compiling the shaders: ${device.gl.getShaderInfoLog(shader)}`
                    );
                    device.gl.deleteShader(shader);
                    return '';
                }
                return shader;
            }
        }
        return null;
    }
    add_vertex_attribute(device: RenderDevice, key:string,value:string){
        if(device.gl && this.program){
            this.attributes[key] = device.gl.getAttribLocation(this.program, value);
        }
    }
    add_uniform(device: RenderDevice, key:string,value:string){
        if(device.gl && this.program){
            this.uniforms[key] = device.gl.getUniformLocation(this.program, value);
        }
    }
    create_graphics_pipeline(device: RenderDevice):void{
        if(device.gl){
            const v_shader:WebGLShader | null = this.load_shader(device, device.gl.VERTEX_SHADER, this.v_source);
            const f_shader:WebGLShader | null = this.load_shader(device, device.gl.FRAGMENT_SHADER, this.f_source);

            if(v_shader && f_shader){
                const pipeline:WebGLProgram | null = device.gl.createProgram();
                if(pipeline){
                    device.gl.attachShader(pipeline, v_shader);
                    device.gl.attachShader(pipeline, f_shader);
                    device.gl.linkProgram(pipeline);

                    if (!device.gl.getProgramParameter(pipeline, device.gl.LINK_STATUS)) {
                        alert(
                        `Unable to initialize the shader program: ${device.gl.getProgramInfoLog(
                            pipeline
                        )}`
                        );
                    }else{
                        this.program = pipeline;
                    }
                }
            }
        }
    }

    bind_pipeline(device:RenderDevice){
        if(device.gl && this.program){
            device.gl.useProgram(this.program);
        }
    }
}

export class RenderBuffer{
    public data:Array<number> = [];
    private buffer:WebGLBuffer | null;
    private componentCount:number = 0;
    constructor(device:RenderDevice,componentCount:number,data:Array<number>, indicies:boolean = false){
        const GL = (device.gl as WebGL2RenderingContext);
        this.buffer = GL.createBuffer();
        this.componentCount = componentCount;
        this.data = data;
        if(indicies){
            GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.buffer);
            GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), GL.STATIC_DRAW);
        }else{
            GL.bindBuffer(GL.ARRAY_BUFFER, this.buffer);
            GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(data), GL.STATIC_DRAW);
        }
    }
    bind_buffer(device:RenderDevice,attribute:number){
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
        if(device.gl != null){
            device.gl.bindBuffer(device.gl.ELEMENT_ARRAY_BUFFER, this.buffer);
        }
    }

    get_buffer_data(){
        return {componentCount: this.componentCount,data: this.data};
    }
}

export enum DepthCompare{
    LESS = 0,
    LEQUAL = 1,
    EQUAL = 2,
    GEQUAL = 3,
    GREATER = 4
}

export class RenderPass{
    depth:number = 0.0;
    depth_function:DepthCompare = DepthCompare.EQUAL;
    color:Array<number> = [];
    begin_renderpass(device:RenderDevice):boolean{
        if(device.gl){
            let buffers:number = 0;
            if(this.color.length == 4){
                device.gl.clearColor(this.color[0], 
                    this.color[1], 
                    this.color[2], 
                    this.color[3]);
                buffers |= device.gl.COLOR_BUFFER_BIT;
            }
            if(this.depth > 0.0){
                buffers |= device.gl.DEPTH_BUFFER_BIT;
                device.gl.clearDepth(this.depth);
                device.gl.enable(device.gl.DEPTH_TEST); 
                switch(this.depth_function){
                    case DepthCompare.LESS:
                        device.gl.depthFunc(device.gl.LESS);
                        break;
                    case DepthCompare.LEQUAL:
                        device.gl.depthFunc(device.gl.LEQUAL);
                        break;
                    case DepthCompare.EQUAL:
                        device.gl.depthFunc(device.gl.EQUAL);
                        break;
                    case DepthCompare.GEQUAL:
                        device.gl.depthFunc(device.gl.GEQUAL);
                        break;
                    case DepthCompare.GREATER:
                        device.gl.depthFunc(device.gl.GREATER);
                        break;
                }
            }
            if(buffers > 0){
                device.gl.clear(buffers);
                return true;
            }else{
                console.log("skipping creation of renderpass", this);
                return false;
            }
        }
        return false;
    }
}

export class RenderDevice{
    gl:WebGL2RenderingContext | null = null;
    canvas:HTMLCanvasElement | null = document.querySelector('#glcanvas');
    init_renderer():void{
        if (!(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error('No html canvas element.');
        }
        
        // WebGL rendering context
        this.gl = this.canvas.getContext('webgl2')!;
    
        if (!this.gl) {
            throw new Error('Unable to initialize WebGL.');
        }
    }

    get_canvas_resolution():{[key:string]:number}{
        if(this.canvas){
            return {
                width: this.canvas.width,
                height: this.canvas.height
            };
        }
        return {
            width: 0,
            height: 0,
        };
    }

    upload_matri4x4f(location:WebGLUniformLocation | null, data:Float32List, transpose:boolean = false):void{
        if(this.gl){
            this.gl.uniformMatrix4fv(
                location,
                transpose,
                data
            );
        }
    }

    draw(offset:number, vertexCount:number){
        if (this.gl) {
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);
        }
    }
    
    draw_indexed(offset:number, vertexCount:number){
        if (this.gl) {
            const type = this.gl.UNSIGNED_SHORT;
            this.gl.drawElements(this.gl.TRIANGLES, vertexCount, type, offset);
        }
    }
}