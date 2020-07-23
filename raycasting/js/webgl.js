"use strict";

var vs = `#version 300 es
in vec4 a_position;
uniform mat4 MVPmatrix;


void main(){
  gl_Position = MVPmatrix*a_position;

}`;

var fs = `#version 300 es 
precision mediump float;

out vec4 FragColor;

void main(){
  FragColor = vec4(1, 0.5, 0.5, 1);
}
`;

function main() {
  var canvas = document.querySelector("#canvas");
  console.log(canvas);
  let gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

  var positionLocation = gl.getAttribLocation(program, "a_position");
  var matrixLocation = gl.getUniformLocation(program, "MVPmatrix");

  let vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  let positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl);
  gl.enableVertexAttribArray(positionLocation);

  const cubeVertexIndices = new Uint16Array([
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
    23,
  ]);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndices);

  let size = 3;
  let type = gl.FLOAT;
  let normalize = false;
  let stride = 0;
  let offset = 0;

  gl.vertexAttribPointer(
    positionLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  function degreeToRadian(degree) {
    return (degree * Math.PI) / 180;
  }
  let fieldOfViewRadian = degreeToRadian(60);

  drawScene();

  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.5, 0.7, 1.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);

    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);

    gl.bindVertexArray(vao);

    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    let zNear = 0.001;
    let zFar = 2000;

    let projectionMatrix = m4.perspective(
      fieldOfViewRadian,
      aspect,
      zNear,
      zFar
    );

    let modelMatrix = m4.identity();
    modelMatrix = m4.translate(modelMatrix, 0, 0, -4);
    modelMatrix = m4.xRotate(modelMatrix, 0.5);
    modelMatrix = m4.yRotate(modelMatrix, 0.5);

    let cameraMatrix = m4.yRotation(0);
    cameraMatrix = m4.translate(cameraMatrix, 0, 0, 200);
    let viewMatrix = m4.inverse(cameraMatrix);

    let modelView = m4.multiply(viewMatrix, modelMatrix);
    let viewProjectionMatrix = m4.multiply(projectionMatrix, modelView);

    gl.uniformMatrix4fv(matrixLocation, false, viewProjectionMatrix);

    let primitiveType = gl.TRIANGLES;
    let offset = 0;
    let count = 6 * 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}

main();

function setGeometry(gl) {
  let positionData = new Float32Array([
    -10,
    -10,
    -10,
    10,
    -10,
    -10,
    10,
    10,
    -10,
    -10,
    10,
    -10,
    -10,
    -10,
    10,
    10,
    -10,
    10,
    10,
    10,
    10,
    -10,
    10,
    10,
    -10,
    -10,
    -10,
    -10,
    10,
    -10,
    -10,
    10,
    10,
    -10,
    -10,
    10,
    10,
    -10,
    -10,
    10,
    10,
    -10,
    10,
    10,
    10,
    10,
    -10,
    10,
    -10,
    -10,
    -10,
    -10,
    -10,
    10,
    10,
    -10,
    10,
    10,
    -10,
    -10,
    -10,
    10,
    -10,
    -10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    -10,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);
}
