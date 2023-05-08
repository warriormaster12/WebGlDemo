import { RenderDevice, Pipeline, RenderPass, RenderBuffer, DepthCompare } from './renderer/render_device';
import {mat4, vec3} from 'gl-matrix';
import {Mesh} from './resources/mesh';

import exampleVsShader from './shaders/example.vert';
import exampleFsShader from './shaders/example.frag';


const device = new RenderDevice();
const pipeline = new Pipeline();
const main_renderpass = new RenderPass();

const cubes:Array<Mesh> = [];

function main():void{
  device.init_renderer();
  
  pipeline.v_source = exampleVsShader;
  pipeline.f_source = exampleFsShader;
  pipeline.create_graphics_pipeline(device);
  pipeline.add_vertex_attribute(device, "vertexPosition", "aVertexPosition");
  pipeline.add_vertex_attribute(device, "vertexColor", "aVertexColor");
  pipeline.add_uniform(device, "projectionMatrix", "uProjectionMatrix");
  pipeline.add_uniform(device, "modelViewMatrix", "uModelViewMatrix");
  
  const positions:Array<number> = [
    // Front face
    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
  
    // Back face
    -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
  
    // Top face
    -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
  
    // Bottom face
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
  
    // Right face
    1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
  
    // Left face
    -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
  ];   
  const faceColors = [
    [1.0, 1.0, 1.0, 1.0], // Front face: white
    [1.0, 0.0, 0.0, 1.0], // Back face: red
    [0.0, 1.0, 0.0, 1.0], // Top face: green
    [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
    [1.0, 1.0, 0.0, 1.0], // Right face: yellow
    [1.0, 0.0, 1.0, 1.0], // Left face: purple
  ];
  
  let colors:Array<number> = [];
  for (let j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];
    // Repeat each color four times for the four vertices of the face
    colors = colors.concat(c, c, c, c);
  }

  const indices:Array<number> = [
    0,
    1,
    2,
    0,
    2,
    3, // front
    4,
    5,
    6,
    4,
    6,
    7, // back
    8,
    9,
    10,
    8,
    10,
    11, // top
    12,
    13,
    14,
    12,
    14,
    15, // bottom
    16,
    17,
    18,
    16,
    18,
    19, // right
    20,
    21,
    22,
    20,
    22,
    23, // left
  ];
  const cube_pos:Array<vec3> = [
    [-1.6, 0.3, -6.0],
    [0.0, -0.6, -4.0],
    [2.0, 0.0, -6.6]
  ];
  for(let i=0; i < 3; i++){
    const cube = new Mesh(device);
    cube.add_attribute(pipeline.attributes.vertexPosition, 3,positions);
    cube.add_attribute(pipeline.attributes.vertexColor, 4, colors);
    cube.add_indicies(indices);
    cube.position = cube_pos[i];
    cubes.push(cube);
  }

  main_renderpass.color = [0.1, 0.25, 0.5, 1];
  main_renderpass.depth = 1.0;
  main_renderpass.depth_function = DepthCompare.LEQUAL;
    
}

let deltaTime:number = 0;
let then:number = 0;
let cubeRotation:number = 0;

function draw_scene(now:number){
  now *= 0.001;
  deltaTime = now - then;
  then = now;

  cubeRotation += deltaTime;

  if(main_renderpass.begin_renderpass(device)){
    const resolution = device.get_canvas_resolution();
    const fieldOfView:number = (45 * Math.PI) / 180;
    const aspect = resolution.width / resolution.height;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    for(let i:number = 0; i < cubes.length; i++){
      const modelViewMatrix = mat4.create()
      pipeline.bind_pipeline(device);
      cubes[i].bind_mesh();
      // Set the shader uniforms
      mat4.translate(
        modelViewMatrix,
        modelViewMatrix,
        cubes[i].position
      );
      if(i==0){
        mat4.rotate(
          modelViewMatrix,
          modelViewMatrix,
          cubeRotation * 0.4,
          [0,1,0]
        );
      }
      else if(i==1){
        mat4.rotate(
          modelViewMatrix,
          modelViewMatrix,
          cubeRotation * 0.8,
          [1,0,0]
        );
      }
      else{
        mat4.rotate(
          modelViewMatrix,
          modelViewMatrix,
          cubeRotation * 0.2,
          [0,0,1]
        );
      }
      
      mat4.scale(
        modelViewMatrix,
        modelViewMatrix,
        [0.5,0.5,0.5]
      );
      if(device.gl){
        device.gl.uniformMatrix4fv(
          pipeline.uniforms.projectionMatrix,
          false,
          projectionMatrix
        );
        device.gl.uniformMatrix4fv(
          pipeline.uniforms.modelViewMatrix,
          false,
          modelViewMatrix
        );
        cubes[i].draw_mesh();
      }
    }
  }
  requestAnimationFrame(draw_scene);
}
main();
requestAnimationFrame(draw_scene);
