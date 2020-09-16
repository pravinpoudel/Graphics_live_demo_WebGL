const { mat4, mat3, vec3, vec2, quat } = glMatrix;

let mouseClicked = false;
let prev_point;
let current_point;

let rotation = mat3.create();
let qstart = quat.create();

let cameraMatrix = mat4.create();
let centerTranslation = mat4.create();
let forwardTranslation = vec3.create();
let inverseCamera = mat4.create();

let canvas = document.querySelector("#canvas");
let loader = document.querySelector(".loader");
let loaderDimension = loader.getBoundingClientRect();

function initialCameraSetup(cameraPosition, up) {
  // find the orientation axis of an camera
  let center = [0.5, 0.5, 0.5];
  let vcenter = vec3.set(vec3.create(), center[0], center[1], center[2]);
  vcameraPosition = vec3.set(
    vec3.create(),
    cameraPosition[0],
    cameraPosition[1],
    cameraPosition[2]
  );
  let vup = vec3.create();
  vec3.set(vup, up[0], up[1], up[2]);

  let forward = vec3.create();
  vec3.sub(forward, vcenter, vcameraPosition);
  let forwardDistance = vec3.len(forward);
  vec3.normalize(forward, forward);

  let right = vec3.create();
  vec3.cross(right, forward, vup);
  vec3.normalize(right, right);

  up = vec3.cross(vec3.create(), right, forward);
  vec3.normalize(up, up);

  vec3.cross(right, forward, up);
  vec3.normalize(right, right);

  rotation = mat3.fromValues(
    right[0],
    right[1],
    right[2],
    up[0],
    up[1],
    up[2],
    -forward[0],
    -forward[1],
    -forward[2]
  );

  mat3.transpose(rotation, rotation);

  mat4.fromTranslation(centerTranslation, center);
  mat4.invert(centerTranslation, centerTranslation);

  vec3.set(forwardTranslation, 0, 0, -1.0 * forwardDistance);
  forwardTranslation = mat4.fromTranslation(mat4.create(), forwardTranslation);

  // find the camera matrix that transform the camera space to world space
  // rotation[0][0] = right[0];
  // rotation[0][1] = right[1];
  // rotation[0][2] = right[2];
  // rotation[1][0] = up[0];
  // rotation[1][1] = up[1];
  // rotation[1][2] = up[2];
  // rotation[0][0] = forward[0];
  // rotation[1][1] = forward[1];
  // rotation[2][2] = forward[2];

  // vec3.set(
  //   cameraPosition,
  //   cameraPosition[0],
  //   cameraPosition[1],
  //   cameraPosition[2]
  // );

  rotation = quat.fromMat3(quat.create(), rotation);
  quat.normalize(rotation, rotation);
  cameraUpdate();
  return cameraMatrix;
}

function getMousePosDown(event) {
  prev_point = [event.clientX, event.clientY];
  prev_point = pointClamp(prev_point);
  prev_point = vec2.set(vec2.create(), prev_point[0], prev_point[1]);
  prev_point = pointtoArcBall(prev_point);
}

// to find the current point in mouse drag
function getMousePosMove(event) {
  current_point = [event.clientX, event.clientY];
  current_point = pointClamp(current_point);
  vec2.set(current_point, current_point[0], current_point[1]);
  current_point = pointtoArcBall(current_point);
  console.log(prev_point);
  rotate(current_point);
  return cameraMatrix;
}

function rotate(current_point) {
  console.log(current_point);
  let q = quat.create();
  //multiplication of two quaternion without real-part encompass two vector products with
  //single quaternion product
  quat.multiply(q, current_point, prev_point);
  quat.multiply(rotation, q, rotation);

  prev_point = current_point;
  cameraUpdate();
}

function pointtoArcBall(point) {
  //dot product of a point with itself is square of that point vector's magnitude
  let r = vec2.dot(point, point);
  let q = quat.create();

  if (r > 1.0) {
    //correction for the case if cursor lies outside the circle
    vec2.normalize(point, point);
    quat.set(q, point[0], point[1], 0.0, 0.0);
  } else {
    let z = Math.sqrt(1.0 - r);
    quat.set(q, point[0], point[1], z, 0.0);
  }
  //we created quaternions without realparts, or more precisely, with zero real parts
  return q;
}

function pointClamp(point) {
  // here we again select canvas because the canvas we have already selected has loader so it doesn't give correct canvasDimension.top
  //when we again select the canvas here, we get same canvas but this time without loader in our windows.

  canvas = document.querySelector("#canvas");
  let canvasDimension = canvas.getBoundingClientRect();

  //clamping in the y direction isn't done as same as x because Y axis start from top left in event cordinate system
  // whereas in WebGL it starts from bottom left

  point = [
    Math.min(
      Math.max(
        (2 * (point[0] - canvasDimension.left)) / canvasDimension.width - 1.0,
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

function cameraUpdate() {
  mat4.fromQuat(cameraMatrix, rotation);
  mat4.multiply(cameraMatrix, cameraMatrix, centerTranslation);
  mat4.multiply(cameraMatrix, forwardTranslation, cameraMatrix);
  mat4.invert(inverseCamera, cameraMatrix);
  cameraPosition = [inverseCamera[12], inverseCamera[13], inverseCamera[14]];
}
