
const YOUTUBE_VIDEO_ID = "KOEtAFYeFSY";

const overlay = document.getElementById("challengeOverlay");
const finalOverlay = document.getElementById("finalOverlay");
const answers = document.getElementById("answers");
const feedback = document.getElementById("feedback");
const continueBtn = document.getElementById("continueBtn");
const restartBtn = document.getElementById("restartBtn");
const xpEl = document.getElementById("xp");
const correctEl = document.getElementById("correctCount");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const missionCount = document.getElementById("missionCount");
const missionTitle = document.getElementById("missionTitle");
const missionDescription = document.getElementById("missionDescription");
const timerEl = document.getElementById("timer");

// Preguntas integradas en el propio JavaScript.
// Nota: esto no oculta las respuestas al inspeccionar el código.
// "time" = segundo del video en que se pausa. "answer" = posición de la correcta (0 = A, 1 = B, 2 = C).
const lessonData = {
  lessonTitle: "Laplace Challenge — Clase 4, parte 4",
  lessonDescription: "Reducción de sistemas de orden superior: polos dominantes y aproximación de segundo orden",
  challenges: [
    { time: 230, title: "Obtén los polos", icon: "🔍", question: "En MATLAB, ¿cómo se obtienen los polos de F(s) = 180000/(s⁴ + 159s³ + 6386s² + 50400s + 180000)?", options: ["Con roots([180000]), usando solo el numerador", "Con exp(), aplicada a los coeficientes", "Con roots([1 159 6386 50400 180000]), usando los coeficientes del denominador"], answer: 2, explanation: "Los polos son las raíces del denominador, así que se le pasa a roots el vector de coeficientes del denominador.", xp: 100 },
    { time: 420, title: "Lee los polos", icon: "📍", question: "¿Cuáles son los cuatro polos de F(s) obtenidos con roots?", options: ["−100, −50 y −4.5 ± 3.97i", "100, 50 y 4.5 ± 3.97i (todos positivos)", "−1, −0.5 y −0.045 ± 0.0397i"], answer: 0, explanation: "MATLAB mostraba los valores multiplicados por 10², por eso −1.0000 corresponde a −100, −0.5000 a −50 y −0.0450 ± 0.0397i a −4.5 ± 3.97i.", xp: 100 },
    { time: 495, title: "Qué polos ignorar", icon: "✂️", question: "Al reducir el sistema, ¿qué polos se ignoran y por qué?", options: ["Los complejos −4.5 ± 3.97i, por ser complejos", "Los de −50 y −100, por estar lejos de los polos complejos", "Ninguno: siempre se conservan los cuatro polos"], answer: 1, explanation: "Los polos en −50 y −100 están lejos de los polos complejos, así que se ignoran y se conservan −4.5 ± 3.97i.", xp: 100 },
    { time: 620, title: "Ajusta la ganancia", icon: "➗", question: "Al ignorar los polos −50 y −100, ¿por qué el numerador pasa de 180000 a 36?", options: ["Porque se resta 50 y 100 al numerador", "Porque el numerador siempre se reemplaza por 36", "Porque se divide 180000 entre 50 y entre 100"], answer: 2, explanation: "180000/(50·100) = 36: se divide por los polos ignorados para conservar la ganancia del sistema.", xp: 150 },
    { time: 720, title: "Compara con la forma estándar", icon: "🧩", question: "Al comparar 36/(s² + 9s + 36) con kωn²/(s² + 2ζωn·s + ωn²), ¿qué resulta?", options: ["ωn = 6 y ζ = 0.75: respuesta subamortiguada", "ωn = 36 y ζ = 9: respuesta sobreamortiguada", "ωn = 6 y ζ = 1.5: respuesta sobreamortiguada"], answer: 0, explanation: "ωn² = 36 da ωn = 6, y 2ζωn = 9 da ζ = 9/(2·6) = 0.75, que está entre 0 y 1: subamortiguada.", xp: 150 },
    { time: 780, title: "Tiempo de establecimiento", icon: "⏱️", question: "Con ζ = 0.75 y ωn = 6, ¿cuánto vale aproximadamente ts ≈ 4/(ζωn)?", options: ["Aproximadamente 4.5 segundos", "Aproximadamente 0.89 segundos", "Aproximadamente 0.22 segundos"], answer: 1, explanation: "ts ≈ 4/(0.75·6) = 4/4.5 ≈ 0.89 segundos.", xp: 150 },
    { time: 815, title: "Desafío final", icon: "🏆", question: "¿Qué comparación propone el profesor al final del video?", options: ["Los polos de F(s) con sus ceros, en Simulink", "El orden 4 con el orden 2, pero solo a mano sin simular", "La respuesta del sistema original de orden 4 con la del reducido de orden 2, en MATLAB"], answer: 2, explanation: "Se simulan en MATLAB el sistema original de orden 4 y el reducido de orden 2 para ver si sus respuestas se parecen.", xp: 200 }
  ]
};
let challenges = lessonData.challenges;

let current = 0;
let xp = 0;
let correct = 0;
let challengeOpen = false;
let answered = false;
let timer = null;
let seconds = 20;

// ============================================================
// YOUTUBE: reproductor + revisión del tiempo
// ============================================================
let player = null;        // objeto del reproductor de YouTube
let playerReady = false;  // true cuando el reproductor terminó de cargar
let watcher = null;       // intervalo que revisa el tiempo del video
let pendingPlay = false;  // por si se pide play antes de que cargue

// Carga la librería de YouTube. Cuando está lista, YouTube llama
// automáticamente a onYouTubeIframeAPIReady (debe ser una función global).
(function loadYouTubeAPI() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

window.onYouTubeIframeAPIReady = function () {
  // Reemplaza <div id="lessonVideo"> por el reproductor (un iframe)
  player = new YT.Player("lessonVideo", {
    videoId: YOUTUBE_VIDEO_ID,
    playerVars: {
      rel: 0,            // al pausar, solo sugiere videos de tu canal
      modestbranding: 1, // logo de YouTube más discreto
      playsinline: 1,    // reproduce dentro de la página en iPhone
      fs: 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
};

function onPlayerReady() {
  playerReady = true;
  if (pendingPlay) playVideo();
}

// YouTube avisa cada vez que el video cambia de estado:
// 1 = reproduciendo, 2 = en pausa, 0 = terminó, 3 = cargando...
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    startWatcher();
  } else {
    stopWatcher();
  }
  if (event.data === YT.PlayerState.ENDED) {
    handleEnded();
  }
}

// Reemplaza al evento "timeupdate" del <video>, que YouTube no tiene:
// mientras el video se reproduce, consultamos el tiempo cada 250 ms.
function startWatcher() {
  stopWatcher();
  watcher = setInterval(checkChallenge, 250);
}

function stopWatcher() {
  clearInterval(watcher);
  watcher = null;
}

function checkChallenge() {
  if (!playerReady || challengeOpen || current >= challenges.length) return;
  const c = challenges[current];
  if (player.getCurrentTime() >= c.time) {
    pauseVideo();
    showChallenge(c);
  }
}

function handleEnded() {
  if (current < challenges.length && !challengeOpen) {
    current = challenges.length;
    updateDashboard();
    finish();
  }
}

// Funciones auxiliares para no repetir código ni fallar si
// el reproductor todavía no ha cargado.
function playVideo() {
  if (!playerReady) { pendingPlay = true; return; }
  pendingPlay = false;
  player.playVideo();
}

function pauseVideo() {
  if (playerReady) player.pauseVideo();
}

function restartVideo() {
  if (playerReady) player.seekTo(0, true);
}

// ============================================================
// LÓGICA DE LA ACTIVIDAD (igual que antes)
// ============================================================
function updateDashboard() {
  const done = current;
  const total = challenges.length || 1;
  const pct = Math.round((done / total) * 100);
  progressBar.style.width = `${pct}%`;
  progressText.textContent = `Misión ${done} de ${challenges.length}`;
  progressPercent.textContent = `${pct}%`;
  xpEl.textContent = xp;
  correctEl.textContent = correct;
  missionCount.textContent = `${String(Math.min(current + 1, challenges.length)).padStart(2,"0")} / ${String(challenges.length).padStart(2,"0")}`;
}

function showChallenge(c) {
  challengeOpen = true;
  answered = false;
  seconds = 20;
  clearInterval(timer);
  timerEl.textContent = seconds;

  document.getElementById("challengeTitle").textContent = c.title;
  document.getElementById("challengeQuestion").textContent = c.question;
  document.getElementById("challengeIcon").textContent = c.icon;
  feedback.textContent = "";
  feedback.className = "feedback";
  continueBtn.classList.add("hidden");
  answers.innerHTML = "";

  c.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer";
    btn.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
    btn.addEventListener("click", () => chooseAnswer(index));
    answers.appendChild(btn);
  });

  missionTitle.textContent = c.title;
  missionDescription.textContent = "Responde el reto para continuar con la clase.";
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");

  timer = setInterval(() => {
    seconds--;
    timerEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(timer);
      if (!answered) chooseAnswer(-1);
    }
  }, 1000);
}

function chooseAnswer(index) {
  if (answered) return;
  answered = true;
  clearInterval(timer);

  const c = challenges[current];
  const buttons = [...answers.querySelectorAll(".answer")];
  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === c.answer) b.classList.add("correct");
    if (i === index && index !== c.answer) b.classList.add("wrong");
  });

  if (index === c.answer) {
    correct++;
    xp += c.xp;
    feedback.textContent = `✓ ${c.explanation} +${c.xp} XP`;
    feedback.className = "feedback good";
  } else {
    feedback.textContent = index === -1
      ? `⏱️ Se acabó el tiempo. ${c.explanation}`
      : `✕ No esta vez. ${c.explanation}`;
    feedback.className = "feedback bad";
  }

  xpEl.textContent = xp;
  correctEl.textContent = correct;
  continueBtn.classList.remove("hidden");
}

continueBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
  challengeOpen = false;
  current++;
  updateDashboard();

  if (current >= challenges.length) {
    finish();
    return;
  }

  missionTitle.textContent = "Sigue observando";
  missionDescription.textContent = "El siguiente reto aparecerá automáticamente durante la explicación.";
  playVideo();
});

function finish() {
  pauseVideo();
  document.getElementById("finalXP").textContent = xp;
  document.getElementById("finalCorrect").textContent = `${correct}/${challenges.length}`;
  document.getElementById("finalMessage").textContent =
    correct >= 5
      ? "Excelente trabajo. Completaste todos los retos de esta clase."
      : "Actividad completada. Puedes repetirla para reforzar los conceptos.";
  finalOverlay.classList.remove("hidden");
  finalOverlay.setAttribute("aria-hidden", "false");
  progressBar.style.width = "100%";
  progressText.textContent = `Misión ${challenges.length} de ${challenges.length}`;
  progressPercent.textContent = "100%";
}

restartBtn.addEventListener("click", () => {
  current = 0;
  xp = 0;
  correct = 0;
  challengeOpen = false;
  clearInterval(timer);
  finalOverlay.classList.add("hidden");
  finalOverlay.setAttribute("aria-hidden", "true");
  restartVideo();
  updateDashboard();
  missionTitle.textContent = "Prepárate";
  missionDescription.textContent = "Mira la clase y presta atención: aparecerán retos durante la explicación.";
  playVideo();
});

function loadQuestions() {
  document.title = lessonData.lessonTitle || document.title;
  document.querySelector(".topbar h1").textContent = lessonData.lessonTitle || "Laplace Challenge";
  document.querySelector(".topbar p").textContent = lessonData.lessonDescription || "Actividad interactiva";
  document.querySelector(".stats div:nth-child(2) strong").textContent = challenges.length;
  document.getElementById("missionCount").textContent = `01 / ${String(challenges.length).padStart(2,"0")}`;
  document.getElementById("progressText").textContent = `Misión 0 de ${challenges.length}`;
  document.getElementById("finalCorrect").textContent = `0/${challenges.length}`;
  updateDashboard();
}

loadQuestions();
