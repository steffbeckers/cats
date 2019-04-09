export default function (p5) {
  let width = 0;
  let height = 0;

  p5.setup = function () {
    width = document.getElementById('sketch').clientWidth;
    height = document.getElementById('sketch').clientHeight;
    p5.createCanvas(width, height);
  }

  p5.windowResized = function () {
    width = document.getElementById('sketch').clientWidth;
    height = document.getElementById('sketch').clientHeight;
    p5.resizeCanvas(width, height);
  }

  p5.draw = function () {
    // Black dots
    p5.fill(0);
    p5.ellipse(p5.random(0, width), p5.random(0, height), 10, 10);
  }
}