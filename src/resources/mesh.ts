import { RenderDevice,RenderBuffer } from '../renderer/render_device';
import {vec3} from 'gl-matrix';

export class Mesh{
    private device:RenderDevice;
    private attributes:{[key:number]:RenderBuffer} = {};
    position:vec3 = vec3.create();
    private indexBuffer:RenderBuffer | null = null;
    constructor(device:RenderDevice){
        this.device = device;
    }

    add_attribute(attribute:number, componentCount:number,data:Array<number>){
        this.attributes[attribute] = new RenderBuffer(this.device, componentCount,data);
    }

    add_indicies(data:Array<number>){
        this.indexBuffer = new RenderBuffer(this.device, 0,data, true);
    }

    bind_mesh(){
        for(const [key_str, value] of Object.entries(this.attributes)){
            const key:number = parseInt(key_str);
            value.bind_buffer(this.device,key);
        }
        if(this.indexBuffer){
            this.indexBuffer.bind_index_buffer(this.device);
        }
    }

    draw_mesh(){
        for(const [key, value] of Object.entries(this.attributes)){
            const bufferData = value.get_buffer_data();
            if(key == "0"){
                if(this.indexBuffer){
                    this.device.draw_indexed(0, this.indexBuffer.data.length);
                }else{
                    this.device.draw(0, bufferData.data.length / bufferData.componentCount);
                }
            }
        }
    }
}