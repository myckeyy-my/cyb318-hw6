// Boots the prototype: load the square circuit, then start the loop.

import { loadTrack } from "./track.js";
import { Game } from "./game.js";

const canvas = document.querySelector("#game");
const speedEl = document.querySelector("#speed");
const nameEl = document.querySelector("#track-name");
const errorEl = document.querySelector("#error");

loadTrack("./data/tracks.json", "prototype")
  .then((track) => {
    nameEl.textContent = track.name;
    const game = new Game(canvas, track, {
      onUpdate(player) {
        speedEl.textContent = `${Math.round(player.speed * 3.6)} km/h`;
      }
    });
    game.start();
    canvas.focus();
  })
  .catch((error) => {
    errorEl.hidden = false;
    errorEl.textContent = error.message;
    console.error(error);
  });
