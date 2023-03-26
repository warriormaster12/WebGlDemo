import { RenderDevice, Pipeline, RenderPass } from './renderer/render_device.js';
import { mat4 } from 'gl-matrix';
import { Mesh } from './resources/mesh.js';
const device = new RenderDevice();
const pipeline = new Pipeline();
const main_renderpass = new RenderPass();
const squares = [];
function main() {
    device.init_renderer();
    fetch('shader/example.vs')
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error(error));
    pipeline.v_source = `#version 300 es
      in vec4 aVertexPosition;
      in vec4 aVertexColor;
      
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;

      out vec4 vColor;

      void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;
      }
    `;
    pipeline.f_source = `#version 300 es
    precision highp float;
    in vec4 vColor;
    out vec4 outColor;
    void main(void) {
      outColor = vColor;
    }
  `;
    pipeline.create_graphics_pipeline(device);
    pipeline.add_vertex_attribute(device, "vertexPosition", "aVertexPosition");
    pipeline.add_vertex_attribute(device, "vertexColor", "aVertexColor");
    pipeline.add_uniform(device, "projectionMatrix", "uProjectionMatrix");
    pipeline.add_uniform(device, "modelViewMatrix", "uModelViewMatrix");
    const positions = [
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
        [1.0, 1.0, 1.0, 1.0],
        [1.0, 0.0, 0.0, 1.0],
        [0.0, 1.0, 0.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],
        [1.0, 1.0, 0.0, 1.0],
        [1.0, 0.0, 1.0, 1.0], // Left face: purple
    ];
    let colors = [];
    for (let j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        // Repeat each color four times for the four vertices of the face
        colors = colors.concat(c, c, c, c);
    }
    const indices = [
        0,
        1,
        2,
        0,
        2,
        3,
        4,
        5,
        6,
        4,
        6,
        7,
        8,
        9,
        10,
        8,
        10,
        11,
        12,
        13,
        14,
        12,
        14,
        15,
        16,
        17,
        18,
        16,
        18,
        19,
        20,
        21,
        22,
        20,
        22,
        23, // left
    ];
    const cube_pos = [
        [-1.5, 0.0, -6.0],
        [0.0, 0.6, -4.0],
        [2.0, 0.0, -6.6]
    ];
    for (let i = 0; i < 3; i++) {
        const square = new Mesh(device);
        square.add_attribute(pipeline.attributes.vertexPosition, 3, positions);
        square.add_attribute(pipeline.attributes.vertexColor, 4, colors);
        square.add_indicies(indices);
        square.position = cube_pos[i];
        squares.push(square);
    }
    main_renderpass.info.color = true;
    main_renderpass.info.depth = true;
}
let deltaTime = 0;
let then = 0;
let cubeRotation = 0;
function draw_scene(now) {
    now *= 0.001;
    deltaTime = now - then;
    then = now;
    cubeRotation += deltaTime;
    if (main_renderpass.begin_renderpass(device)) {
        const resolution = device.get_canvas_resolution();
        const fieldOfView = (45 * Math.PI) / 180;
        const aspect = resolution.width / resolution.height;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
        for (let square of squares) {
            const modelViewMatrix = mat4.create();
            pipeline.bind_pipeline(device);
            square.bind_mesh();
            // Set the shader uniforms
            mat4.translate(modelViewMatrix, modelViewMatrix, square.position);
            mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7, [0, 1, 0]);
            mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7, [1, 0, 0]);
            mat4.scale(modelViewMatrix, modelViewMatrix, [0.5, 0.5, 0.5]);
            device.gl.uniformMatrix4fv(pipeline.uniforms.projectionMatrix, false, projectionMatrix);
            device.gl.uniformMatrix4fv(pipeline.uniforms.modelViewMatrix, false, modelViewMatrix);
            square.draw_mesh();
        }
    }
    requestAnimationFrame(draw_scene);
}
main();
requestAnimationFrame(draw_scene);
