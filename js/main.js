// Loads the championship tracks, then starts the racing loop.

import { loadTrack } from "./track.js";
import { Game } from "./game.js";
import { createCarSprites } from "./renderer.js";
import { formatLapTime } from "./qualifying.js";
import {
  championshipLevels,
  getChampionshipLevel
} from "./championship.js";

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
const tutorialEl = document.querySelector("#tutorial");
const tutorialTitleEl = document.querySelector("#tutorial-title");
const tutorialKickerEl = document.querySelector("#tutorial-kicker");
const tutorialBadgeEl = document.querySelector("#tutorial-badge");
const tutorialContinueButton = document.querySelector("#tutorial-continue");
const obstacleCardEl = document.querySelector("#obstacle-card");
const objectiveLevelEl = document.querySelector("#objective-level");
const objectiveTrackEl = document.querySelector("#objective-track");
const objectiveTargetEl = document.querySelector("#objective-target");
const objectiveTextEl = document.querySelector("#objective-text");

let game = null;

function showTutorial(levelNumber) {
  tutorialEl.hidden = false;
  tutorialBadgeEl.textContent = `L${levelNumber}`;
  obstacleCardEl.hidden = levelNumber !== 2;

  if (levelNumber === 1) {
    tutorialKickerEl.textContent = "HOW TO PLAY — LEVEL 1";
    tutorialTitleEl.textContent = "WELCOME TO APEX RUSH";
    objectiveLevelEl.textContent = "LEVEL 1 — QUALIFYING";
    objectiveTrackEl.textContent = "TRACK: EXISTING TEST TRACK";
    objectiveTargetEl.textContent = "50.000 s";
    objectiveTextEl.innerHTML =
      "<strong>OBJECTIVE:</strong> Complete a valid lap in less than 50 seconds to qualify for Level 2.";
  } else {
    tutorialKickerEl.textContent = "MASTER THE CHICANES. ATTACK THE HAIRPINS.";
    tutorialTitleEl.textContent = "LEVEL 2 — TECHNICAL CIRCUIT";
    objectiveLevelEl.textContent = "LEVEL 2 — QUALIFYING";
    objectiveTrackEl.textContent = "TRACK: SILVERSTONE";
    objectiveTargetEl.textContent = "50.000 s";
    objectiveTextEl.innerHTML =
      "<strong>OBJECTIVE:</strong> Complete a valid lap in less than 50 seconds by navigating the chicanes and 180-degree turns.";
  }
}

function updateHud(player, qualifying) {
  if (game.tutorialOpen) {
    showTutorial(game.currentLevel);
  } else {
    tutorialEl.hidden = true;
  }
  if (game.championshipWon) {
    showChampionshipVictory();
    return;
  }

  const level = getChampionshipLevel(game.currentLevel);
  if (nameEl.textContent !== game.track.name) {
    nameEl.textContent = game.track.name;
    trackFooterEl.textContent = `${game.track.name} · R to restart`;
  }
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

const trackIds = [
  ...new Set(championshipLevels.map((level) => level.trackId))
];

Promise.all([
  Promise.all(
    trackIds.map((id) => loadTrack("./data/tracks.json", id))
  ),
  loadCarImage("./elements/car.png")
])
  .then(([loadedTracks, carImage]) => {
    const tracks = new Map(
      loadedTracks.map((track) => [track.id, track])
    );
    game = new Game(canvas, tracks, {
      onUpdate(player, qualifying) {
        updateHud(player, qualifying);
      },
      onVictory() {
        showChampionshipVictory();
      }
    }, createCarSprites(carImage));
    tutorialContinueButton.addEventListener("click", () => {
      game.closeTutorial();
      tutorialEl.hidden = true;
      canvas.focus();
    });
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
