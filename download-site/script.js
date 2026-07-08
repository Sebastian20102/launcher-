const canvas = document.querySelector("#motion-grid");
const context = canvas.getContext("2d");
let width = 0;
let height = 0;
let tick = 0;

function resize() {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(scale, 0, 0, scale, 0, 0);
}

function draw() {
  tick += 0.004;
  context.clearRect(0, 0, width, height);
  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 1;

  const gap = 48;
  for (let x = -gap; x < width + gap; x += gap) {
    context.beginPath();
    for (let y = 0; y < height; y += 16) {
      const wave = Math.sin(y * 0.012 + tick * 8 + x * 0.01) * 8;
      const px = x + wave;
      if (y === 0) context.moveTo(px, y);
      else context.lineTo(px, y);
    }
    context.stroke();
  }

  for (let y = 0; y < height + gap; y += gap) {
    context.beginPath();
    context.moveTo(0, y + Math.sin(tick * 8 + y * 0.02) * 6);
    context.lineTo(width, y + Math.cos(tick * 8 + y * 0.02) * 6);
    context.stroke();
  }

  requestAnimationFrame(draw);
}

resize();
draw();
window.addEventListener("resize", resize);
