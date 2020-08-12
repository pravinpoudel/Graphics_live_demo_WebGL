const vs = `#version 300 es

in vec3 a_position;

uniform mat4 u_worldViewProjection;
uniform vec3 u_dimensionScale;

void main(){

  // don't mutate a_position since it is allowable and it will throw error
  vec3 translation = vec3(0.5,0.5,0.5)-vec3(1, 1,1)*0.5;
  gl_Position = u_worldViewProjection* vec4(vec3(1, 1, 1)*a_position + translation, 1);

}
`;

const fs = `#version 300 es

precision highp float;

uniform highp sampler3D volumeMap;
uniform highp sampler2D colorMap;

out vec4 outColor;

void main(){

  float volumedata = texture(volumeMap, vec3(0,0.5,0.5)).r;
  vec3 colordata = texture(colorMap, vec2(volumedata, 0.5)).rgb;
  outColor = vec4(colordata,0.5);

}

`;

let gl = null;
let program = null;
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
let volumeMapLoc;

let url =
  "https://www.dl.dropboxusercontent.com/s/7d87jcsh0qodk78/fuel_64x64x64_uint8.raw?dl=1";
let dims = [64, 64, 64];

(function () {
  let canvas = document.getElementById("canvas");
  gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  program = webglUtils.createProgramFromSources(gl, [vs, fs]);

  let positionLoc = gl.getAttribLocation(program, "a_position");

  let worldViewLocation = gl.getUniformLocation(
    program,
    "u_worldViewProjection"
  );
  let dimScaleLocation = gl.getUniformLocation(program, "u_dimensionScale");

  volumeMapLoc = gl.getUniformLocation(program, "volumeMap");
  let colormapLoc = gl.getUniformLocation(program, "colorMap");

  let vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  let positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeStrip), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

  let texture = gl.createTexture();
  let image = new Image();
  image.src = "../raycasting/colormaps/cool-warm-colormap.png";
  gl.activeTexture(gl.TEXTURE1);
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
    new Uint8Array([0, 255, 0, 255])
  );

  image.onload = function () {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, image);
    console.log(image.src);
  };

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.generateMipmap(gl.TEXTURE_2D);

  drawScene();

  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.4, 0.4, 0.5, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform1i(colormapLoc, 1);

    let cameraPosition = [0, 2, 2];
    let cameraMatrix = m4.lookAt(cameraPosition, [0, 0, 0], up);
    let viewMatrix = m4.inverse(cameraMatrix);

    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    let fov = (60 * Math.PI) / 180;
    let perspective = m4.perspective(aspect, fov, 0.01, 1000);
    let viewPerspective = m4.multiply(perspective, viewMatrix);
    gl.uniformMatrix4fv(worldViewLocation, false, viewPerspective);

    fetchData(dimScaleLocation);
  }
})();

async function fetchData(dimScaleLocation) {
  let response = await fetch(url);
  let data = await response.body.getReader().read();
  data = data.value;
  if (data) {
    dataBuffer = new Uint8Array(data);
    loadData(dataBuffer);
  } else {
    console.log("action aborted");
  }

  function loadData(dataBuffer) {
    let texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, texture);
    gl.texImage3D(
      gl.TEXTURE_3D,
      0,
      gl.R8,
      dims[0],
      dims[1],
      dims[2],
      0,
      gl.RED,
      gl.UNSIGNED_BYTE,
      dataBuffer
    );

    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.uniform1i(volumeMapLoc, 0);

    let maxValue = Math.max(...dims);
    let dimensionScale = [
      dims[0] / maxValue,
      dims[1] / maxValue,
      dims[2] / maxValue,
    ];

    gl.uniform3fv(dimScaleLocation, dimensionScale);
    console.log(dimensionScale);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, cubeStrip.length / 3);
  }
}
