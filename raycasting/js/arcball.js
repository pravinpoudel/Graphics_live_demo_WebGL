const { mat4, mat3, vec3, vec2, quat } = glMatrix;

let mouseClicked = false;
let prev_point;
let current_point;
let rotation;

let canvas = document.querySelector("#canvas");
let loader = document.querySelector(".loader");
let loaderDimension = loader.getBoundingClientRect();

function initialSetup() {
  // intitial camera orientation setup
  //intiailize the value of camera/view matrix so that it can be called for first time also
}

canvas.addEventListener("mousedown", getMousePosDown);
canvas.addEventListener("mouseup", getMousePosUp);
canvas.addEventListener("mousemove", getMousePosMove);

function getMousePosDown(event) {
  if (event.button === 0) {
    mouseClicked = true;
    prev_point = [event.clientX, event.clientY];
    prev_point = pointClamp(prev_point);
    vec2.set(prev_point, prev_point[0], prev_point[1]);
    prev_point = pointtoArcBall(prev_point);
  }
}

// to find the current point in mouse drag
function getMousePosMove(event) {
  if (!mouseClicked) {
    console.log("------------------------");
  } else {
    current_point = [event.clientX, event.clientY];
    current_point = pointClamp(current_point);
    vec2.set(current_point, current_point[0], current_point[1]);
    current_point = pointtoArcBall(current_point);
    console.log(current_point);
  }
}

function getMousePosUp(event) {
  mouseClicked = false;
  if (mouseClicked) {
    console.log("mouse is up");
  }
}

function pointtoArcBall(point) {
  let r = vec2.length(point);
  let q = quat.create();
  if (r >= 1.0) {
    vec2.normalize(point, point);
    quat.set(q, point[0], point[1], 0.0, 0.0);
  } else {
    let z = Math.sqrt(1 - r);
    quat.set(q, point[0], point[1], z, 0.0);
  }
  return q;
}

function pointClamp(point) {
  canvas = document.querySelector("#canvas");
  let canvasDimension = canvas.getBoundingClientRect();
  point = [
    Math.min(
      Math.max(
        (2 * (point[0] - canvasDimension.left)) / canvasDimension["width"] -
          1.0,
        -1.0
      ),
      1.0
    ),
    Math.min(
      Math.max(
        1.0 - (2.0 * (point[1] - canvasDimension.top)) / canvasDimension.height,
        -1.0
      ),
      1.0
    ),
  ];

  return point;
}
