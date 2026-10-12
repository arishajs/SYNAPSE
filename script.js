
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Footer year
$("#year").textContent = new Date().getFullYear();

// Mobile navigation
const menuToggle = $("#menuToggle");
const navigation = $("#navigation");

menuToggle.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "×" : "☰";
});

$$("nav a").forEach(link => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  });
});

// Reveal elements on scroll
const revealElements = $$(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach(el => revealObserver.observe(el));
} else {
  revealElements.forEach(el => el.classList.add("visible"));
}

// Interactive neural sphere
const brainStage = $("#brainStage");

$$(".mind-point").forEach(point => {
  point.addEventListener("click", () => {
    const zone = point.dataset.zone;

    if (zone === "Memory") openModal("memoryModal");
    if (zone === "Emotion") openModal("emotionModal");

    if (zone === "Focus") {
      $("#focus").scrollIntoView({ behavior: "smooth" });
    }
  });
});

// Gentle mouse-follow depth effect
if (brainStage && window.matchMedia("(pointer: fine)").matches) {
  brainStage.addEventListener("pointermove", event => {
    const rect = brainStage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    brainStage.style.transform =
      `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
  });

  brainStage.addEventListener("pointerleave", () => {
    brainStage.style.transform =
      "perspective(900px) rotateY(0deg) rotateX(0deg)";
  });
}

// Modal helpers
let lastFocusedElement = null;

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("modal-open");

  const firstButton = $("button", modal);
  if (firstButton) firstButton.focus();
}

function closeModal(modal) {
  if (!modal) return;

  modal.hidden = true;

  if (!$(".modal:not([hidden])")) {
    document.body.classList.remove("modal-open");
  }

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

$("#openMemory").addEventListener("click", () => openModal("memoryModal"));
$("#openEmotion").addEventListener("click", () => openModal("emotionModal"));

$$("[data-close]").forEach(button => {
  button.addEventListener("click", () => closeModal(button.closest(".modal")));
});

$$(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal(modal);
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    const open = $(".modal:not([hidden])");
    if (open) closeModal(open);
  }
});

// MEMORY LAB
const memoryTiles = $$(".memory-tile");
const memoryStatus = $("#memoryStatus");
const memoryLevel = $("#memoryLevel");
const memoryStart = $("#memoryStart");

let sequence = [];
let userSequence = [];
let round = 1;
let acceptingInput = false;
let gameToken = 0;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function flashTile(index, token) {
  if (token !== gameToken) return;

  const tile = memoryTiles[index];
  tile.classList.add("lit");
  await wait(420);
  tile.classList.remove("lit");
  await wait(180);
}

async function showSequence(token) {
  acceptingInput = false;
  memoryTiles.forEach(tile => tile.disabled = true);
  memoryStatus.textContent = "Watch the sequence carefully...";

  await wait(450);

  for (const index of sequence) {
    if (token !== gameToken) return;
    await flashTile(index, token);
  }

  if (token !== gameToken) return;

  acceptingInput = true;
  memoryTiles.forEach(tile => tile.disabled = false);
  memoryStatus.textContent = "Your turn — repeat the sequence.";
}

async function startRound() {
  const token = gameToken;
  userSequence = [];
  sequence.push(Math.floor(Math.random() * memoryTiles.length));
  memoryLevel.textContent = `ROUND ${round}`;
  await showSequence(token);
}

memoryStart.addEventListener("click", () => {
  gameToken++;
  sequence = [];
  userSequence = [];
  round = 1;
  acceptingInput = false;
  memoryTiles.forEach(tile => {
    tile.disabled = true;
    tile.classList.remove("lit");
  });
  memoryStart.textContent = "Restart challenge";
  startRound();
});

memoryTiles.forEach(tile => {
  tile.disabled = true;

  tile.addEventListener("click", async () => {
    if (!acceptingInput) return;

    const index = Number(tile.dataset.tile);
    const token = gameToken;

    tile.classList.add("lit");
    setTimeout(() => tile.classList.remove("lit"), 180);

    userSequence.push(index);
    const currentPosition = userSequence.length - 1;

    if (userSequence[currentPosition] !== sequence[currentPosition]) {
      acceptingInput = false;
      memoryTiles.forEach(button => button.disabled = true);
      memoryStatus.textContent =
        `Not quite! You reached round ${round}. Try again to beat your score.`;
      memoryStart.textContent = "Try again";
      return;
    }

    if (userSequence.length === sequence.length) {
      acceptingInput = false;
      memoryTiles.forEach(button => button.disabled = true);
      round++;

      if (round > 8) {
        memoryStatus.textContent =
          "Amazing! You completed all 8 rounds. Challenge mastered!";
        memoryLevel.textContent = "COMPLETED";
        memoryStart.textContent = "Play again";
        return;
      }

      memoryStatus.textContent = "Correct! Get ready for the next round.";
      await wait(750);

      if (token === gameToken) startRound();
    }
  });
});

// EMOTION EXPLORER
const emotionMessages = {
  Calm: "Give yourself permission to enjoy this quiet moment. You do not need to rush into the next thing.",
  Curious: "Follow one question that genuinely interests you. Curiosity can be a starting point for discovery.",
  Overwhelmed: "Pause for a moment. Choose one small, manageable next step instead of solving everything at once.",
  Motivated: "Choose one meaningful task and begin with a small action. Progress does not need to be perfect."
};

$$("[data-emotion]").forEach(button => {
  button.addEventListener("click", () => {
    $$(".emotion-options button").forEach(item =>
      item.classList.toggle("selected", item === button)
    );

    const emotion = button.dataset.emotion;
    $("#emotionResult").textContent = emotionMessages[emotion];
  });
});

// FOCUS TIMER
const timerDisplay = $("#timerDisplay");
const timerStatus = $("#timerStatus");
const timerStart = $("#timerStart");
const timerReset = $("#timerReset");
const timerRing = $(".timer-ring");
const durationButtons = $$(".duration");

let selectedMinutes = 1;
let remainingSeconds = 60;
let timerInterval = null;
let timerRunning = false;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(remainingSeconds);

  const total = selectedMinutes * 60;
  const progress = total > 0 ? (total - remainingSeconds) / total : 0;
  const degrees = Math.min(360, Math.max(0, progress * 360));

  timerRing.style.background =
    `conic-gradient(var(--gold) ${degrees}deg, rgba(201,169,110,.09) ${degrees}deg)`;
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  timerRunning = false;
}

function resetTimer() {
  stopTimer();
  remainingSeconds = selectedMinutes * 60;
  timerStart.textContent = "Begin session";
  timerStatus.textContent = "Your quiet moment is ready.";
  renderTimer();
}

durationButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (timerRunning) {
      timerStatus.textContent = "Pause or reset your session before changing duration.";
      return;
    }

    durationButtons.forEach(item =>
      item.classList.toggle("active", item === button)
    );

    selectedMinutes = Number(button.dataset.minutes);
    resetTimer();
  });
});

timerStart.addEventListener("click", () => {
  if (timerRunning) {
    stopTimer();
    timerStart.textContent = "Resume session";
    timerStatus.textContent = "Session paused. Resume when ready.";
    return;
  }

  if (remainingSeconds <= 0) resetTimer();

  timerRunning = true;
  timerStart.textContent = "Pause session";
  timerStatus.textContent = "Take a breath. Stay with the present moment.";

  timerInterval = setInterval(() => {
    remainingSeconds--;
    renderTimer();

    if (remainingSeconds <= 0) {
      stopTimer();
      remainingSeconds = 0;
      renderTimer();
      timerStart.textContent = "Start again";
      timerStatus.textContent = "Session complete. Take a moment before moving on.";
    }
  }, 1000);
});

timerReset.addEventListener("click", resetTimer);
renderTimer();

// Ambient particles — no external library required
const canvas = $("#particles");
const ctx = canvas.getContext("2d");
let particles = [];
let canvasWidth = 0;
let canvasHeight = 0;
let animationFrame = null;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;

  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(65, Math.floor(canvasWidth / 18));

  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    radius: Math.random() * 1.4 + 0.3,
    speed: Math.random() * 0.22 + 0.06,
    alpha: Math.random() * 0.45 + 0.1
  }));

  if (reducedMotion) drawParticles(false);
}

function drawParticles(animate = true) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  particles.forEach(particle => {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(218,190,137,${particle.alpha})`;
    ctx.fill();

    if (animate) {
      particle.y -= particle.speed;

      if (particle.y < -3) {
        particle.y = canvasHeight + 3;
        particle.x = Math.random() * canvasWidth;
      }
    }
  });

  if (animate) animationFrame = requestAnimationFrame(() => drawParticles(true));
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

if (!reducedMotion) {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  drawParticles(true);
}

// Active navigation highlight
const sections = $$("main section[id]");
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      $$("nav a").forEach(link => {
        link.classList.toggle(
          "active",
          link.getAttribute("href") === `#${entry.target.id}`
        );
      });
    });
  }, { rootMargin: "-35% 0px -55% 0px" });

  sections.forEach(section => sectionObserver.observe(section));
}
brainStage.style.transform =
  `perspective(900px)
   rotateY(${x * 18}deg)
   rotateX(${-y * 18}deg)
   scale(1.03)`;