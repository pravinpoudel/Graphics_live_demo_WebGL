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
let miptypeLoc;
let rayFunctionLoc;
let rayFunction = 1.0;
let threshValue = 10.0;
let selectedMap = 2.0;
let cameraPosition;
let viewMatrix;

let url =
  "https://www.dl.dropboxusercontent.com/s/7d87jcsh0qodk78/fuel_64x64x64_uint8.raw?dl=1";

let dims = [64, 64, 64];

(function () {
  canvas = document.getElementById("canvas");

  canvas.addEventListener("mousedown", maingetMousePosDown);
  canvas.addEventListener("mouseup", maingetMousePosUp);
  canvas.addEventListener("mousemove", maingetMousePosMove);

  function maingetMousePosDown(event) {
    if (event.button === 0) {
      mouseClicked = true;
      getMousePosDown(event);
    }
  }

  function maingetMousePosUp(event) {
    mouseClicked = false;
    if (mouseClicked) {
      console.log("mouse is up");
    }
  }

  function maingetMousePosMove(event) {
    if (!mouseClicked) {
      console.log("------------------------");
    } else {
      viewMatrix = getMousePosMove(event);
      drawScene();
    }
  }

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
  miptypeLoc = gl.getUniformLocation(program, "miptype");
  rayFunctionLoc = gl.getUniformLocation(program, "rayFunction");

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

  let fovDegree = 60;
  let fov = degreeToRadian(fovDegree);
  let cameraAngleRadian = degreeToRadian(0);

  let funcButtons = document.querySelectorAll(".neon-button");
  funcButtons.forEach((funcButton) => {
    funcButton.addEventListener("click", (event) => {
      if (event.target.classList.contains("active")) {
        return;
      } else {
        document.querySelector(".sorry").style.display = "none";
        let isoOption = document.querySelector(".select-iso-color");
        isoOption.classList.toggle("mipActive");
        rayFunction = +event.target.getAttribute("data-value");
        drawScene();
        let active = document.querySelector(".neon-button.active");
        if (active) {
          active.classList.remove("active");
        }
        event.target.classList.add("active");
      }
    });
  });

  function updateCameraAngle(event, ui) {
    cameraAngleRadian = degreeToRadian(ui.value);
    drawScene();
  }

  let threshSlider = document.getElementById("sliderInput");
  let display = document.getElementById("thresholdValue");
  display.innerHTML = threshSlider.value;

  threshSlider.oninput = function () {
    threshValue = 1.0 * this.value;
    display.innerHTML = this.value;
    drawScene();
  };

  let isoOptions = document.querySelectorAll(
    'input[type="radio"][name="isoType"]'
  );
  isoOptions.forEach((radio) =>
    radio.addEventListener("change", (event) => {
      selectedMap = +event.target.value;
      drawScene();
    })
  );

  // let selector = document.getElementById("iso-color");
  // selector.addEventListener("change", (event) => {
  //   let selectorValue = +event.target.value;
  //   if (selectorValue !== selectedMap) {
  //     selectedMap = selectorValue;
  //     drawScene();
  //   }
  // });

  let cameraMatrix = m4.yRotation(cameraAngleRadian);
  cameraMatrix = m4.translate(cameraMatrix, 0.5, 0.5, 1.5);
  cameraPosition = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]];
  cameraPosition = [0, 0.5, 1.5];
  viewMatrix = initialCameraSetup(cameraPosition, up);

  // ------------------------------------------------------------------------------
  fetchData(dimScaleLocation);
  // --------------------------------------------------------------------------------

  async function fetchData(dimScaleLocation) {
    let response = await fetch(url);
    let data = await response.arrayBuffer();
    document.getElementsByClassName("loader")[0].style.display = "none";
    document.getElementById("iso-div").style.display = "block";
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
    }
    drawScene();
  }

  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform1f(thresholdLoc, threshValue);
    gl.uniform1f(miptypeLoc, selectedMap);
    gl.uniform1f(rayFunctionLoc, rayFunction);
    gl.uniform3fv(dimensionVolumeLoc, dims);
    gl.uniform1i(colormapLoc, 1);
    gl.uniform1i(volumeMapLoc, 0);

    let maxValue = Math.max(...dims);
    let dimensionScale = [
      dims[0] / maxValue,
      dims[1] / maxValue,
      dims[2] / maxValue,
    ];

    gl.uniform3fv(dimScaleLocation, dimensionScale);

    console.log(cameraPosition);
    gl.uniform3fv(eyePositionLocation, cameraPosition);

    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

    let perspective = m4.perspective(aspect, fov, 0.01, 1000);
    console.log(perspective);
    let viewPerspective = m4.multiply(perspective, viewMatrix);
    gl.uniformMatrix4fv(worldViewLocation, false, viewPerspective);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, cubeStrip.length / 3);
  }
})();
