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
        v_color = vec4(1,1,1,1);
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

  const cubeVertexindices = [0, 2, 3, 1, 3, 5, 4, 5, 7, 6, 0, 2, 7, 6, 4, 1];

  let vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeVertexindices, gl.STATIC_DRAW);

  let positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl);
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

  drawScene();

  function drawScene() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.5, 0.7, 0.5, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gl.useProgram(program);

    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    let projection = m4.perspective((60 * Math.PI) / 180, aspect, 0.1, 1000);

    gl.uniformMatrix4fv(umatrixLocation, false, projection);

    gl.drawElements(gl.LINE_STRIP, 16, gl.UNSIGNED_SHORT, 0);
  }
}

function setGeometry(gl) {
  let position = [
    -100,
    100,
    0, //0
    100,
    100,
    0, //1
    -100,
    -100,
    0, //2
    100,
    -100,
    0, //3
    100,
    100,
    100, //4
    100,
    -100,
    100, //5
    -100,
    100,
    100, //6
    -100,
    100,
    0, //7
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Int32Array(position), gl.STATIC_DRAW);
}

main();
