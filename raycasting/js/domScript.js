const burgerSlide = () => {
  const burgerElement = document.getElementsByClassName("burger")[0];
  const menuList = document.getElementsByClassName("menu-list")[0];
  const listItem = document.querySelectorAll(".menu-list li");

  burgerElement.addEventListener("click", function (event) {
    console.log("i am clicked");
    menuList.classList.toggle("nav-active");
    burgerElement.classList.toggle("toggle");
    listItem.forEach((element, index) => {
      if (element.style.animation) {
        element.style.animation = "";
      } else {
        element.style.animation = `menulistfade 0.5s ease forwards ${
          index / 7 + 0.1
        }s`;
      }
    });
  });
};


