// Frame loop. Order is fixed: input, physics, collision, camera, draw.
// Collision and physics stay in world meters. The camera is applied only while drawing.

import { config } from "./config.js";
import { clearInput, readInput } from "./input.js";
import { createPlayer, getWheelPositions, updatePlayer } from "./player.js";
import { createCamera, updateCamera, applyCamera } from "./camera.js";
import { resolveCollisions } from "./collision.js";
import { drawTrack, drawCar } from "./renderer.js";
import {
  createLapDetector,
  synchronizeLapDetector,
  updateLapDetector
} from "./lap-detection.js";
import {
  createQualifyingSession,
  qualifyingStates
} from "./qualifying.js";
import { getTrackSurface, isOnTrack } from "./track.js";
import {
  championshipLevels,
  getChampionshipLevel
} from "./championship.js";

export class Game {
  constructor(canvas, tracks, hooks, carSprites) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.tracks = tracks;
    this.hooks = hooks;
    this.carSprites = carSprites;
    this.currentLevel = 1;
    this.unlockedLevel = 1;
    this.championshipWon = false;
    this.track = this.getTrackForLevel(this.currentLevel);
    this.player = createPlayer(this.track.spawn);
    this.camera = createCamera(this.player.heading);
    this.lapDetector = createLapDetector(this.track, this.player);
    this.qualifying = createQualifyingSession(
      this.track,
      getChampionshipLevel(this.currentLevel).targetLapTimeSeconds
    );
    this.tutorialOpen = this.currentLevel <= 2;
    this.view = { width: 1, height: 1, dpr: 1 };
    this.lastTime = 0;
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    this.view = { width, height, dpr };
  }

  start() {
    window.addEventListener("resize", () => this.resize());
    requestAnimationFrame((time) => this.frame(time));
  }

  frame(time) {
    if (!this.lastTime) {
      this.lastTime = time;
      requestAnimationFrame((next) => this.frame(next));
      return;
    }

    const dt = Math.min((time - this.lastTime) / 1000, config.maxDeltaTime);
    this.lastTime = time;
    this.update(dt);
    this.render();
    requestAnimationFrame((next) => this.frame(next));
  }

  update(dt) {
    if (this.tutorialOpen) {
      const tutorialResult = this.qualifying.snapshot(performance.now());
      if (tutorialResult.qualified) {
        this.unlockNextLevel();
      }
      this.hooks.onUpdate(this.player, tutorialResult);
      return;
    }
    const now = performance.now();
    const currentResult = this.qualifying.snapshot(now);
    if (currentResult.qualified) {
      this.unlockNextLevel();
    }
    if (currentResult.state === qualifyingStates.SESSION_COMPLETED) {
      this.hooks.onUpdate(this.player, currentResult);
      return;
    }

    const input = readInput();
    const surface = getTrackSurface(
      this.track,
      getWheelPositions(this.player)
    );
    updatePlayer(this.player, input, dt, surface === "runoff");
    const collided = resolveCollisions(
      this.player,
      this.track.walls,
      this.track.obstacles
    );
    if (collided) {
      this.qualifying.handleCollision(now);
      synchronizeLapDetector(this.lapDetector, this.player);
    } else {
      const wheels = Object.values(getWheelPositions(this.player));
      const allWheelsOutside = wheels.every(
        (wheel) => !isOnTrack(this.track, wheel)
      );
      if (allWheelsOutside) {
        this.qualifying.handleTrackLimitViolation(now);
        synchronizeLapDetector(this.lapDetector, this.player);
      } else if (updateLapDetector(this.lapDetector, this.player)) {
        this.qualifying.handleCrossing(now);
      }
    }
    updateCamera(this.camera, this.player.heading, config.cameraTurnRate, dt);
    const qualifying = this.qualifying.snapshot(now);
    if (qualifying.qualified) {
      this.unlockNextLevel();
    }
    this.hooks.onUpdate(this.player, qualifying);
  }

  restart() {
    if (this.championshipWon) {
      return false;
    }
    this.resetQualifyingSession();
    this.hooks.onUpdate(
      this.player,
      this.qualifying.snapshot(performance.now())
    );
    return true;
  }

  resetQualifyingSession() {
    this.track = this.getTrackForLevel(this.currentLevel);
    this.player = createPlayer(this.track.spawn);
    this.camera = createCamera(this.player.heading);
    this.lapDetector = createLapDetector(this.track, this.player);
    this.qualifying = createQualifyingSession(
      this.track,
      getChampionshipLevel(this.currentLevel).targetLapTimeSeconds
    );
    this.tutorialOpen = this.currentLevel <= 2;
    clearInput();
  }

  finishQualifying() {
    if (this.championshipWon || !this.qualifying.finish()) {
      return false;
    }
    this.unlockNextLevel();
    this.hooks.onUpdate(
      this.player,
      this.qualifying.snapshot(performance.now())
    );
    return true;
  }

  advanceLevel() {
    if (this.championshipWon) {
      return false;
    }

    const result = this.qualifying.snapshot(performance.now());
    if (
      result.state !== "SESSION_COMPLETED" ||
      result.result !== "QUALIFIED"
    ) {
      return false;
    }
    this.unlockNextLevel();

    if (this.currentLevel === championshipLevels.length) {
      this.championshipWon = true;
      if (this.hooks.onVictory) {
        this.hooks.onVictory();
      }
      return true;
    }

    const nextLevel = this.currentLevel + 1;
    if (nextLevel > this.unlockedLevel) {
      return false;
    }

    this.currentLevel = nextLevel;
    this.unlockedLevel = nextLevel;
    this.resetQualifyingSession();
    this.hooks.onUpdate(
      this.player,
      this.qualifying.snapshot(performance.now())
    );
    return true;
  }

  restartChampionship() {
    this.currentLevel = 1;
    this.unlockedLevel = 1;
    this.championshipWon = false;
    this.resetQualifyingSession();
    this.hooks.onUpdate(
      this.player,
      this.qualifying.snapshot(performance.now())
    );
  }

  closeTutorial() {
    this.tutorialOpen = false;
    clearInput();
  }

  unlockNextLevel() {
    this.unlockedLevel = Math.min(
      championshipLevels.length,
      Math.max(this.unlockedLevel, this.currentLevel + 1)
    );
  }

  getTrackForLevel(level) {
    const levelConfiguration = getChampionshipLevel(level);
    const track = this.tracks.get(levelConfiguration.trackId);
    if (!track) {
      throw new Error(
        `Track "${levelConfiguration.trackId}" for level ${level} is not loaded.`
      );
    }
    return track;
  }

  render() {
    const { ctx, view } = this;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = "#12151b";
    ctx.fillRect(0, 0, view.width, view.height);

    ctx.save();
    applyCamera(
      ctx,
      this.camera,
      this.player,
      view.width,
      view.height,
      config.cameraViewHeight
    );
    drawTrack(ctx, this.track);
    drawCar(ctx, this.player, this.carSprites);
    ctx.restore();
  }
}
