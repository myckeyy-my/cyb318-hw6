// Boots the prototype: load the square circuit, then start the loop.

import { loadTrack } from "./track.js";
import { Game } from "./game.js";
import { formatLapTime } from "./qualifying.js";

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

let game = null;

function updateHud(player, qualifying) {
  speedEl.textContent = `${Math.round(player.speed * 3.6)} km/h`;
  levelEl.textContent = `LEVEL ${game.track.level}`;
  attemptsEl.textContent = `${qualifying.attemptsRemaining} REMAINING`;
  lapEl.textContent = `LAP ${qualifying.currentAttempt} / ${qualifying.totalAttempts}`;
  currentTimeEl.textContent = formatLapTime(qualifying.currentLapTimeMs ?? 0);
  bestTimeEl.textContent = formatLapTime(qualifying.fastestValidLapMs);
  targetTimeEl.textContent = formatLapTime(qualifying.targetLapTimeMs);
  lapCountsEl.textContent = `${qualifying.validLaps} / ${qualifying.invalidLaps}`;
  statusEl.textContent = qualifying.status;
}

loadTrack("./data/tracks.json", "prototype")
  .then((track) => {
    nameEl.textContent = track.name;
    trackFooterEl.textContent = `${track.name} · R to restart`;
    game = new Game(canvas, track, {
      onUpdate(player, qualifying) {
        updateHud(player, qualifying);
      }
    });
    restartButton.addEventListener("click", () => {
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
