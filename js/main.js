// Boots the prototype: load the square circuit, then start the loop.

import { loadTrack } from "./track.js";
import { Game } from "./game.js";
import { createCarSprites } from "./renderer.js";
import { formatLapTime } from "./qualifying.js";
import { getChampionshipLevel } from "./championship.js";

const canvas = document.querySelector("#game");
const speedEl = document.querySelector("#speed");
const nameEl = document.querySelector("#track-name");
const errorEl = document.querySelector("#error");
const levelEl = document.querySelector("#level");
const attemptsEl = document.querySelector("#attempts");
const lapEl = document.querySelector("#lap");
const currentTimeEl = document.querySelector("#current-time");
const bestTimeEl = document.querySelector("#best-time");
const targetTimeEl = document.querySelector("#target-time");
const lapCountsEl = document.querySelector("#lap-counts");
const statusEl = document.querySelector("#status");
const trackFooterEl = document.querySelector("#track-footer");
const restartButton = document.querySelector("#restart");
const nextRoundButton = document.querySelector("#next-round");
const resultsEl = document.querySelector("#results");
const resultsTitleEl = document.querySelector("#results-title");
const resultsMessageEl = document.querySelector("#results-message");
const resultsLevelEl = document.querySelector("#results-level");
const resultsTargetEl = document.querySelector("#results-target");
const resultsBestEl = document.querySelector("#results-best");
const resultsContinueButton = document.querySelector("#results-continue");
const resultsRetryButton = document.querySelector("#results-retry");

let game = null;

function updateHud(player, qualifying) {
  if (game.championshipWon) {
    showChampionshipVictory();
    return;
  }

  const level = getChampionshipLevel(game.currentLevel);
  speedEl.textContent = `${Math.round(player.speed * 3.6)} km/h`;
  levelEl.textContent = `LEVEL ${level.level} · ${level.difficulty.toUpperCase()}`;
  attemptsEl.textContent = `${qualifying.attemptsRemaining} REMAINING`;
  lapEl.textContent = `LAP ${qualifying.currentAttempt} / ${qualifying.totalAttempts}`;
  currentTimeEl.textContent = formatLapTime(qualifying.currentLapTimeMs ?? 0);
  bestTimeEl.textContent = formatLapTime(qualifying.fastestValidLapMs);
  targetTimeEl.textContent = formatLapTime(qualifying.targetLapTimeMs);
  lapCountsEl.textContent = `${qualifying.validLaps} / ${qualifying.invalidLaps}`;
  statusEl.textContent = qualifying.status;
  nextRoundButton.hidden =
    !qualifying.qualified || qualifying.state === "SESSION_COMPLETED";

  if (qualifying.state === "SESSION_COMPLETED") {
    showQualifyingResults(qualifying, level);
  } else {
    resultsEl.hidden = true;
  }
}

function showQualifyingResults(qualifying, level) {
  const qualified = qualifying.result === "QUALIFIED";
  resultsEl.hidden = false;
  resultsTitleEl.textContent = qualified ? "QUALIFIED" : "QUALIFICATION FAILED";
  resultsMessageEl.textContent = qualified
    ? "You beat the qualifying benchmark."
    : "You did not beat the qualifying benchmark.";
  resultsLevelEl.textContent = `Level ${level.level} · ${level.difficulty}`;
  resultsTargetEl.textContent =
    `Target qualifying time: ${formatLapTime(qualifying.targetLapTimeMs)}`;
  resultsBestEl.textContent =
    `Fastest valid lap: ${formatLapTime(qualifying.fastestValidLapMs)}`;
  resultsContinueButton.hidden = !qualified;
  resultsContinueButton.textContent = "CONTINUE";
  resultsRetryButton.hidden = qualified;
}

function showChampionshipVictory() {
  resultsEl.hidden = false;
  resultsTitleEl.textContent = "CHAMPIONSHIP VICTORY";
  resultsMessageEl.textContent = "You have qualified at all three levels.";
  resultsLevelEl.textContent = "All championship levels completed";
  resultsTargetEl.textContent = "";
  resultsBestEl.textContent = "";
  resultsContinueButton.hidden = false;
  resultsContinueButton.textContent = "RESTART CHAMPIONSHIP";
  resultsRetryButton.hidden = true;
}

function loadCarImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load car image "${url}".`));
    image.src = url;
  });
}

Promise.all([
  loadTrack("./data/tracks.json", getChampionshipLevel(1).trackId),
  loadCarImage("./elements/car.png")
])
  .then(([track, carImage]) => {
    nameEl.textContent = track.name;
    trackFooterEl.textContent = `${track.name} · R to restart`;
    game = new Game(canvas, track, {
      onUpdate(player, qualifying) {
        updateHud(player, qualifying);
      },
      onVictory() {
        showChampionshipVictory();
      }
    }, createCarSprites(carImage));
    restartButton.addEventListener("click", () => {
      game.restart();
      canvas.focus();
    });
    nextRoundButton.addEventListener("click", () => {
      if (game.finishQualifying()) {
        canvas.focus();
      }
    });
    resultsContinueButton.addEventListener("click", () => {
      if (game.championshipWon) {
        game.restartChampionship();
      } else {
        game.advanceLevel();
      }
      canvas.focus();
    });
    resultsRetryButton.addEventListener("click", () => {
      game.restart();
      canvas.focus();
    });
    window.addEventListener("keydown", (event) => {
      if (game && event.code === "KeyR" && !event.repeat) {
        game.restart();
      }
    });
    game.start();
    updateHud(game.player, game.qualifying.snapshot(performance.now()));
    canvas.focus();
  })
  .catch((error) => {
    errorEl.hidden = false;
    errorEl.textContent = error.message;
    console.error(error);
  });
