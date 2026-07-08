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

const title = document.querySelector("[data-split-title]");
if (title) {
  title.innerHTML = title.textContent
    .trim()
    .split(" ")
    .map((word, index) => `<span class="word" style="animation-delay:${index * 55}ms">${word}&nbsp;</span>`)
    .join("");
}

const progress = document.querySelector(".scroll-progress");
const heroFrame = document.querySelector("[data-scroll-hero]");

function updateScrollEffects() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  progress.style.width = `${ratio * 100}%`;

  if (heroFrame && window.matchMedia("(min-width: 921px)").matches) {
    const y = Math.min(window.scrollY, 520);
    const rotate = 3 - y * 0.012;
    const lift = y * -0.08;
    heroFrame.style.transform = `perspective(1000px) translateY(${lift}px) rotateX(${rotate}deg) rotateY(${-4 + y * 0.01}deg)`;
  }
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) entry.target.classList.add("in-view");
    }
  },
  { threshold: 0.16 },
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

document.querySelectorAll("[data-tilt]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(max-width: 920px)").matches) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${y * -7}deg) rotateY(${x * 9}deg) translateY(-4px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
    updateScrollEffects();
  });
});

const marquee = document.querySelector(".marquee-track");
if (marquee) marquee.innerHTML += marquee.innerHTML;

window.addEventListener("scroll", updateScrollEffects, { passive: true });
updateScrollEffects();
