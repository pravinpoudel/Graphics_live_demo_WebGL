const { mat4, mat3, vec3, quat } = glMatrix;

let quatInv;
let quat1 = quat.create();
let mouseClicked = false;
// quat.invert(quatInv, quat1);

document.addEventListener("mousedown", getMousePosDown);
document.addEventListener("mouseup", getMousePosUp);
document.addEventListener("mousemove", getMousePosMove);

function getMousePosDown(event) {
  if (event.button === 0) {
    mouseClicked = true;
    console.log(`this is unit quaernion ${quat1}`);
    console.log(event.clientX + " " + event.clientY);
  }
}

function getMousePosMove(event) {
  if (!mouseClicked) {
    console.log("------------------------");
  } else {
    console.log(`mouse position is dragging at ${event.clientX}`);
  }
}

function getMousePosUp(event) {
  mouseClicked = false;
  if (mouseClicked) {
    console.log("mouse is up");
  }
}
