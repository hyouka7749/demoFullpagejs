video.addEventListener(
  "enterpictureinpicture",
  () => (button.textcontent ="Exit PIP")
);
video.addEventListener(
  "leavepictureinpicture",
  () => (button.textcontent ="Enter PIP")
);
button.addEventListener("click", () => 
  document.pictureInPictureElement
    ? document.exitPictureInPicture()
    : video.requestPictureInPicture()
);