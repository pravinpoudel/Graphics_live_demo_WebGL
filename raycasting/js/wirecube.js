"use strict";

const vs = `#version 300 es

    in vec4 a_position;

    uniform mat4 u_matrix;

    void main(){
        gl_Position = u_matrix*a_position;
    }
`;

const fs = `#version 300 es

    precision mediump float;
    out vec4 v_color;

    void main(){
        v_color = vec4(1.0,1.0,1.0,1.0);
    }
`;

function main() {
  const canvas = document.getElementById("canvas");
  let gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  let program = webglUtils.createProgramFromSources(gl, [vs, fs]);
  let positionLoc = gl.getAttribLocation(program, "a_position");
  let umatrixLocation = gl.getUniformLocation(program, "u_matrix");

  const cubeVertexindices = [
    0,
    4,
    4,
    6,
    6,
    2,
    2,
    0, //front
    1,
    0,
    0,
    2,
    2,
    3,
    3,
    1, //right
    5,
    1,
    1,
    3,
    3,
    7,
    7,
    5, //back
    4,
    5,
    5,
    7,
    7,
    6,
    6,
    4, //right
    4,
    0,
    0,
    1,
    1,
    5,
    5,
    4, //top
    6,
    7,
    7,
    3,
    3,
    2,
    2,
    6, //bottom
  ];

  let vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Int32Array(cubeVertexindices),
    gl.STATIC_DRAW
  );

  let positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl);
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
  console.log(vao);
  drawScene();

  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.1, 0.3, 0.4, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    let camera = m4.yRotation(0);
    camera = m4.translate(camera, 0, 100, 300);
    let viewMatrix = m4.inverse(camera);

    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    let projection = m4.perspective((180 * Math.PI) / 180, aspect, 0.1, 1000);

    let viewProjection = m4.multiply(projection, viewMatrix);

    gl.uniformMatrix4fv(umatrixLocation, false, viewProjection);
    gl.lineWidth(6.0);

    gl.drawArrays(gl.LINE_STRIP, 0, 21);
  }
}

function setGeometry(gl) {
  let position = [
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    1,
    0,
    1,
    1,
    0,
    0,
    1,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    1,
    1,
    1,
    0,
    1,
    0,
    0,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Int32Array(position), gl.STATIC_DRAW);
}

main();
