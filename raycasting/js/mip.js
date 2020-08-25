const vs = `#version 300 es

in vec3 a_position;

uniform mat4 u_worldViewProjection;
uniform vec3 u_dimensionScale;
uniform vec3 eye_position;

out vec3 ray_direction;
out vec3 eye_position2;
out vec3 dimensionScale;

void main(){

  vec3 translation = vec3(0.5,0.5,0.5)-u_dimensionScale*0.5;
  gl_Position = u_worldViewProjection* vec4(u_dimensionScale*a_position + translation, 1);
  eye_position2 = (eye_position - translation) / u_dimensionScale;
  ray_direction = a_position - eye_position2;
  
}
`;

const fs = `#version 300 es

precision highp float;

in vec3 ray_direction;
in vec3 eye_position2;

uniform highp sampler3D volumeMap;
uniform highp sampler2D colorMap;
uniform vec3 dimensionVolume;
uniform float thresholdIntensity;


// i dont understand why uniform is throwing error
highp float tmin = 1.175494351e-38;  
highp float tmax = 3.402823466e+38;

out vec4 outColor;

vec2 boxIntersection(vec3 ray_direction2, float origin[3]){
  
  float boxmin[3] = float[3](0.0, 0.0, 0.0);
  float boxmax[3] = float[3](1.0, 1.0, 1.0);
  vec3 invdir = 1.0/ray_direction2;

  float inv_raydirection[3] = float[3](invdir.x, invdir.y, invdir.z);
  for(int i=0; i<3; i++ ){
    float t1 = (boxmin[i]-origin[i])*inv_raydirection[i];
    float t2 = (boxmax[i]-origin[i])*inv_raydirection[i];

    tmin = max(tmin, min(t1, t2));
    tmax = min(tmax, max(t1, t2));
  }

  if(tmax>max(tmin,0.0)){
    return vec2(tmin, tmax);
  }

  else{
    discard;
  }

}

void main(){

  vec3 ray_direction_normal = normalize(ray_direction);
  float origin[3] = float[3](eye_position2.x, eye_position2.y, eye_position2.z);
  
  vec2 two_endpoint = boxIntersection(ray_direction_normal, origin);

  vec3 size_of_voxel = 1.0/dimensionVolume;
  vec3 rayTraverseLength = size_of_voxel/abs(ray_direction_normal);

  float minTraversalLength = min(rayTraverseLength.x, min(rayTraverseLength.y, rayTraverseLength.z));

  vec3 voxelCord = eye_position2 + ray_direction_normal*two_endpoint.x;

  float maxSampleValue = 0.0;
  vec4 colormapData = vec4(0.0, 0.0, 0.0, 0.0);

  for(float t=two_endpoint.x; t<two_endpoint.y; t+=minTraversalLength){

    float volumedata = texture(volumeMap, voxelCord).r;
    
    if(volumedata>thresholdIntensity){
        maxSampleValue= volumedata;
        colormapData = vec4(texture(colorMap, vec2(volumedata, 0.5)).rgb, 1.0);
    }
      voxelCord += ray_direction_normal*minTraversalLength;
    }
  outColor = colormapData;
}

`;
let canvas = null;
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
let thresholdLoc;

let url =
  "https://www.dl.dropboxusercontent.com/s/5rfjobn0lvb7tmo/skull_256x256x256_uint8.raw?dl=1";
let dims = [256, 256, 256];

(function () {
  canvas = document.getElementById("canvas");
  gl = canvas.getContext("webgl2");
  if (!gl) {
    console.log("canvas not founmd");
    return;
  }

  program = webglUtils.createProgramFromSources(gl, [vs, fs]);

  let positionLoc = gl.getAttribLocation(program, "a_position");

  let worldViewLocation = gl.getUniformLocation(
    program,
    "u_worldViewProjection"
  );
  let dimScaleLocation = gl.getUniformLocation(program, "u_dimensionScale");
  let eyePositionLocation = gl.getUniformLocation(program, "eye_position");
  volumeMapLoc = gl.getUniformLocation(program, "volumeMap");
  let colormapLoc = gl.getUniformLocation(program, "colorMap");
  let dimensionVolumeLoc = gl.getUniformLocation(program, "dimensionVolume");
  thresholdLoc = gl.getUniformLocation(program, "thresholdIntensity");

  let vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  let positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeStrip), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

  let texture = gl.createTexture();
  let image = new Image();
  image.crossOrigin = "anonymous";
  // "https://pravinpoudel.github.io/demo-graphics/raycasting/colormaps/cool-warm-paraview.png";

  image.src = "../raycasting/colormaps/matplotlib-plasma.png";
  console.log(image.src);
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
    new Uint8Array([0, 0, 255, 255])
  );

  image.onload = function () {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, image);
  };

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.generateMipmap(gl.TEXTURE_2D);

  function degreeToRadian(angle) {
    return (angle * Math.PI) / 180;
  }

  function radianToDegree(angle) {
    return (180 / Math.PI) * angle;
  }

  let fovDegree = 90;
  let fov = degreeToRadian(fovDegree);
  let cameraAngleRadian = degreeToRadian(0);
  drawScene();

  webglLessonsUI.setupSlider("#cameraAngle", {
    value: radianToDegree(fov),
    slide: updateCameraAngle,
    min: -360,
    max: 360,
  });

  function updateCameraAngle(event, ui) {
    cameraAngleRadian = degreeToRadian(ui.value);
    drawScene();
  }

  let threshSlider = document.getElementById("sliderInput");
  let display = document.getElementById("thresholdValue");
  display.innerHTML = threshSlider.value;

  threshSlider.oninput = function () {
    let threshValue = this.value;
    display.innerHTML = this.value;
    gl.uniform1f(thresholdLoc, threshValue);
    drawScene();
  };

  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform3fv(dimensionVolumeLoc, dims);
    gl.uniform1i(colormapLoc, 1);

    let cameraMatrix = m4.yRotation(cameraAngleRadian);
    cameraMatrix = m4.translate(cameraMatrix, 1, 0.5, 3);

    let cameraPosition = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]];
    gl.uniform3fv(eyePositionLocation, cameraPosition);

    cameraMatrix = m4.lookAt(cameraPosition, [0.5, 0.5, 0.5], up);
    let viewMatrix = m4.inverse(cameraMatrix);

    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    let perspective = m4.perspective(aspect, fov, 0.01, 1000);
    let viewPerspective = m4.multiply(perspective, viewMatrix);
    gl.uniformMatrix4fv(worldViewLocation, false, viewPerspective);

    fetchData(dimScaleLocation);
  }
})();

async function fetchData(dimScaleLocation) {
  let response = await fetch(url);
  let data = await response.arrayBuffer();
  canvas.style.display = "block";
  document.getElementsByClassName("loader")[0].style.display = "none";
  if (data) {
    dataBuffer = new Uint8Array(data);
    console.log(dataBuffer.length);
    loadData(dataBuffer);
  } else {
    console.log("action aborted");
  }

  function loadData(dataBuffer) {
    gl.clearColor(0.11, 0, 0.21, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, texture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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

    gl.uniform1i(volumeMapLoc, 0);

    let maxValue = Math.max(...dims);
    let dimensionScale = [
      dims[0] / maxValue,
      dims[1] / maxValue,
      dims[2] / maxValue,
    ];

    gl.uniform3fv(dimScaleLocation, dimensionScale);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, cubeStrip.length / 3);
  }
}
