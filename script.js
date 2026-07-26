const display = document.getElementById("display");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const minutesInput = document.getElementById("minutesInput");
const secondsInput = document.getElementById("secondsInput");
const presetButtons = document.querySelectorAll(".presets button");
const ringProgress = document.getElementById("ringProgress");

const RING_CIRCUMFERENCE = 2 * Math.PI * 90;
const DEFAULT_TITLE = document.title;

let totalSeconds = 60;
let remainingSeconds = totalSeconds;
let intervalId = null;

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function updateRing() {
  const ratio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const offset = RING_CIRCUMFERENCE * (1 - ratio);
  ringProgress.style.strokeDashoffset = offset;
  ringProgress.classList.toggle("warning", remainingSeconds <= 10 && remainingSeconds > 0);
}

function updateTitle() {
  document.title = intervalId ? `${formatTime(remainingSeconds)} - タイマー` : DEFAULT_TITLE;
}

function updateDisplay() {
  display.textContent = formatTime(remainingSeconds);
  display.classList.toggle("warning", remainingSeconds <= 10 && remainingSeconds > 0);
  updateRing();
  updateTitle();
}

function setInputsFromSeconds(seconds) {
  minutesInput.value = Math.floor(seconds / 60);
  secondsInput.value = seconds % 60;
}

function getSecondsFromInputs() {
  const m = Math.max(0, parseInt(minutesInput.value, 10) || 0);
  const s = Math.max(0, Math.min(59, parseInt(secondsInput.value, 10) || 0));
  return m * 60 + s;
}

function playBeep() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  for (let i = 0; i < 3; i++) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    const startTime = ctx.currentTime + i * 0.4;
    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.3);
  }
}

function tick() {
  remainingSeconds--;
  updateDisplay();
  if (remainingSeconds <= 0) {
    clearInterval(intervalId);
    intervalId = null;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    statusEl.textContent = "タイマー終了！";
    statusEl.classList.add("done");
    updateTitle();
    playBeep();
  }
}

function start() {
  if (intervalId) return;
  if (remainingSeconds <= 0) {
    totalSeconds = getSecondsFromInputs();
    if (totalSeconds <= 0) {
      statusEl.textContent = "時間を設定してください";
      return;
    }
    remainingSeconds = totalSeconds;
  }
  statusEl.textContent = "";
  statusEl.classList.remove("done");
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  minutesInput.disabled = true;
  secondsInput.disabled = true;
  updateDisplay();
  intervalId = setInterval(tick, 1000);
}

function pause() {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  statusEl.textContent = "一時停止中";
  updateTitle();
}

function reset() {
  clearInterval(intervalId);
  intervalId = null;
  totalSeconds = getSecondsFromInputs();
  remainingSeconds = totalSeconds;
  updateDisplay();
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  minutesInput.disabled = false;
  secondsInput.disabled = false;
  statusEl.textContent = "";
  statusEl.classList.remove("done");
  display.classList.remove("warning");
}

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const seconds = parseInt(btn.dataset.seconds, 10);
    setInputsFromSeconds(seconds);
    reset();
  });
});

startBtn.addEventListener("click", start);
pauseBtn.addEventListener("click", pause);
resetBtn.addEventListener("click", reset);
minutesInput.addEventListener("change", reset);
secondsInput.addEventListener("change", reset);

document.addEventListener("keydown", (event) => {
  if (event.target === minutesInput || event.target === secondsInput) return;
  if (event.code === "Space") {
    event.preventDefault();
    intervalId ? pause() : start();
  } else if (event.code === "KeyR") {
    event.preventDefault();
    reset();
  }
});

updateDisplay();
