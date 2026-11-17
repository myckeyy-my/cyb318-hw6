// Frame loop. Order is fixed: input, physics, collision, camera, draw.
// Collision and physics stay in world meters. The camera is applied only while drawing.

import { config } from "./config.js";
import { readInput } from "./input.js";
import { createPlayer, updatePlayer } from "./player.js";
import { createCamera, updateCamera, applyCamera } from "./camera.js";
import { resolveCollisions } from "./collision.js";
import { drawTrack, drawCar } from "./renderer.js";

export class Game {
  constructor(canvas, track, hooks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.track = track;
    this.hooks = hooks;
    this.player = createPlayer(track.spawn);
    this.camera = createCamera(this.player.heading);
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
    const input = readInput();
    updatePlayer(this.player, input, dt);
    resolveCollisions(this.player, this.track.walls);
    updateCamera(this.camera, this.player.heading, config.cameraTurnRate, dt);
    this.hooks.onUpdate(this.player);
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
    drawCar(ctx, this.player);
    ctx.restore();
  }
}
