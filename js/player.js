// The car's world pose. Movement is always along its heading.
// Collision code may change position, speed, and heading after this step.

import { config } from "./config.js";
import { stepHeading, stepSpeed } from "./physics.js";

export function createPlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    heading: spawn.heading,
    speed: 0,
    radius: config.carRadius
  };
}

export function updatePlayer(player, input, dt) {
  const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  player.heading = stepHeading(player.heading, player.speed, steer, config, dt);
  player.speed = stepSpeed(player.speed, input, config, dt);
  player.x += Math.cos(player.heading) * player.speed * dt;
  player.y += Math.sin(player.heading) * player.speed * dt;
}
