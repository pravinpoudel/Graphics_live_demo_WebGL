const vs = `#version 300 es

uniform mat4 u_worldViewProjection;

in vec4 a_position;

void main(){
  
  gl_Position = u_worldViewProjection*a_position;
  
}
`;

const fs = `#version 300 es

precision highp float;
out vec4 outColor;

void main(){

  outColor = vec4(0, 1.0, 1.0, 1.0);
}

`;

function main() {
  let canvas = document.getElementById("canvas");
  let gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  let program = webglUtils.createProgramFromSources(gl, [vs, fs]);
  let positionLoc = gl.getAttribLocation(program, "a_position");
  let worldViewLocation = gl.getUniformLocation(
    program,
    "u_worldViewProjection"
  );
  let vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const cubeStrip = [
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
  const up = [0, 1, 0];

  let positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeStrip), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

  drawScene();

  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.4, 0.4, 0.5, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    let fov = (60 * Math.PI) / 180;

    let cameraPosition = [2, 2, 5];
    let cameraMatrix = m4.lookAt(cameraPosition, [0, 0, 0], up);
    let viewMatrix = m4.inverse(cameraMatrix);
    let perspective = m4.perspective(aspect, fov, 0.01, 1000);

    let viewPerspective = m4.multiply(perspective, viewMatrix);
    gl.uniformMatrix4fv(worldViewLocation, false, viewPerspective);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, cubeStrip.length / 3);
  }
}
main();
