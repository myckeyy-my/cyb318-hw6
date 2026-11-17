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
    steering: 0,
    radius: config.carRadius
  };
}

export function getWheelPositions(player) {
  const forwardX = Math.cos(player.heading);
  const forwardY = Math.sin(player.heading);
  const leftX = -forwardY;
  const leftY = forwardX;
  const front = config.wheelBase / 2;
  const rear = -front;
  const lateral = config.wheelTrack / 2;

  function wheel(forward, side) {
    return {
      x: player.x + forwardX * forward + leftX * side,
      y: player.y + forwardY * forward + leftY * side
    };
  }

  return {
    frontLeft: wheel(front, lateral),
    frontRight: wheel(front, -lateral),
    rearLeft: wheel(rear, lateral),
    rearRight: wheel(rear, -lateral)
  };
}

export function updatePlayer(player, input, dt, onRunoff = false) {
  const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  player.steering = steer * config.maxWheelSteerAngle;
  player.heading = stepHeading(player.heading, player.speed, steer, config, dt);
  const modifiers = onRunoff
    ? {
        accelerationMultiplier: config.runoffAccelerationMultiplier,
        additionalFriction: config.runoffFriction,
        dragCoefficient: config.runoffDragCoefficient
      }
    : undefined;
  player.speed = stepSpeed(player.speed, input, config, dt, modifiers);
  player.x += Math.cos(player.heading) * player.speed * dt;
  player.y += Math.sin(player.heading) * player.speed * dt;
}
