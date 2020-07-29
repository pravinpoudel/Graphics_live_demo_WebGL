"use strict";

var vs = `#version 300 es
precision highp float;
in vec4 a_position;
in vec2 a_texposition;

uniform mat4 modelView;
uniform mat4 projection;

out vec2 v_texcoord;

void main(){
  gl_Position = projection*modelView*a_position;
  v_texcoord = a_texposition;
}`;

var fs = `#version 300 es 
precision highp float;


in vec2 v_texcoord;
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
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const texposLocation = gl.getAttribLocation(program, "a_texposition");

  const projectionLoc = gl.getUniformLocation(program, "projection");
  const modelViewLoc = gl.getUniformLocation(program, "modelView");

  // vertex texture coordinates for a cube
  const cubeVertexPositions = new Float32Array([
    1,
    1,
    -1,
    1,
    1,
    1,
    1,
    -1,
    1,
    1,
    -1,
    -1,
    -1,
    1,
    1,
    -1,
    1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    1,
    -1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    -1,
    -1,
    1,
    -1,
    -1,
    -1,
    -1,
    1,
    -1,
    -1,
    1,
    -1,
    1,
    -1,
    -1,
    1,
    1,
    1,
    1,
    -1,
    1,
    1,
    -1,
    -1,
    1,
    1,
    -1,
    1,
    -1,
    1,
    -1,
    1,
    1,
    -1,
    1,
    -1,
    -1,
    -1,
    -1,
    -1,
  ]);
  // vertex indices for the triangles of a cube
  // the data above defines 24 vertices. We need to draw 12
  // triangles, 2 for each size, each triangle needs
  // 3 vertices so 12 * 3 = 36
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

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertexPositions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(
    positionLocation, // location
    3, // size (components per iteration)
    gl.FLOAT, // type of to get from buffer
    false, // normalize
    0, // stride (bytes to advance each iteration)
    0 // offset (bytes from start of buffer)
  );

  let textcoordbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textcoordbuffer);
  var texcoord = new Float32Array([0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1]);
  gl.bufferData(gl.ARRAY_BUFFER, texcoord, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(texposLocation);

  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 255, 255])
  );

  var image = new Image();
  image.crossOrigin = "";
  image.src = "https://learnopengl.com/img/textures/grass.png";

  image.addEventListener("load", function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipMap(gl.TEXTURE_2D);
  });

  let size = 2;
  let type = gl.FLOAT;
  let normalize = true;
  let stride = 0;
  let offset = 0;
  gl.vertexAttribPointer(texposLocation, size, type, normalize, stride, offset);

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

    const projection = m4.perspective(
      (60 * Math.PI) / 180, // fov
      gl.canvas.clientWidth / gl.canvas.clientHeight, // aspect
      0.1, // near
      10 // far
    );
    gl.uniformMatrix4fv(projectionLoc, false, projection);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndices, gl.STATIC_DRAW);

    // draw center cube

    let modelView = m4.identity();
    modelView = m4.translate(modelView, 0, 0, -4);
    modelView = m4.xRotate(modelView, 0.5);
    modelView = m4.yRotate(modelView, 0.5);

    gl.uniformMatrix4fv(modelViewLoc, false, modelView);

    gl.drawElements(
      gl.TRIANGLES,
      36, // num vertices to process
      gl.UNSIGNED_SHORT, // type of indices
      0 // offset on bytes to indices
    );
  }
}

main();

function setGeometry(gl) {
  let positionData = new Float32Array([
    1,
    1,
    -1,
    1,
    1,
    1,
    1,
    -1,
    1,
    1,
    -1,
    -1,
    -1,
    1,
    1,
    -1,
    1,
    -1,
    -1,
    -1,
    -1,
    -1,
    -1,
    1,
    -1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    -1,
    -1,
    1,
    -1,
    -1,
    -1,
    -1,
    1,
    -1,
    -1,
    1,
    -1,
    1,
    -1,
    -1,
    1,
    1,
    1,
    1,
    -1,
    1,
    1,
    -1,
    -1,
    1,
    1,
    -1,
    1,
    -1,
    1,
    -1,
    1,
    1,
    -1,
    1,
    -1,
    -1,
    -1,
    -1,
    -1,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);
}
