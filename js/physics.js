// Pure speed and heading updates. No canvas, no track, no keyboard events.
// The player module passes in the current state, the keys, and dt.

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function stepSpeed(speed, input, cfg, dt) {
  if (input.brake) {
    speed -= cfg.brake * dt;
  } else if (input.accelerate) {
    speed += cfg.acceleration * dt;
  } else {
    speed -= cfg.friction * dt;
  }

  return clamp(speed, 0, cfg.maxSpeed);
}

// Left is positive. With world +y pointing north, a positive change is a left turn.
// Steering authority falls as speed rises, and it is reduced again near a standstill
// so the car does not spin in place.
export function stepHeading(heading, speed, steer, cfg, dt) {
  const speedRatio = clamp(speed / cfg.maxSpeed, 0, 1);
  const cornerFactor = 1 - speedRatio * (1 - cfg.minSteerFactor);
  const rollingFactor = clamp(speed / cfg.steerReferenceSpeed, cfg.minSteerAtStop, 1);
  return heading + steer * cfg.steerSpeed * cornerFactor * rollingFactor * dt;
}
