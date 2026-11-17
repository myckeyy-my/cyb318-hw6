// Circle-vs-wall test in world meters.
// A hit moves the car back onto the asphalt, then gives it a small rebound
// so it does not stay embedded in the barrier.

import { config } from "./config.js";

function closestPointOnSegment(x, y, segment) {
  const dx = segment.b.x - segment.a.x;
  const dy = segment.b.y - segment.a.y;
  const lengthSquared = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - segment.a.x) * dx + (y - segment.a.y) * dy) / lengthSquared));
  return {
    x: segment.a.x + dx * t,
    y: segment.a.y + dy * t
  };
}

function deepestOverlap(car, walls) {
  let best = null;

  for (const segment of walls) {
    const point = closestPointOnSegment(car.x, car.y, segment);
    const dx = car.x - point.x;
    const dy = car.y - point.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= car.radius) {
      continue;
    }

    let nx = segment.nx;
    let ny = segment.ny;
    if (distance > 1e-6) {
      nx = dx / distance;
      ny = dy / distance;
      if (nx * segment.nx + ny * segment.ny < 0) {
        nx = -nx;
        ny = -ny;
      }
    }

    const penetration = car.radius - distance;
    if (!best || penetration > best.penetration) {
      best = { nx, ny, penetration };
    }
  }

  return best;
}

function applyBounce(car, normal) {
  const vx = Math.cos(car.heading) * car.speed;
  const vy = Math.sin(car.heading) * car.speed;
  const intoWall = vx * normal.nx + vy * normal.ny;

  // Positive means the car is already moving back onto the track.
  if (intoWall >= 0) {
    return;
  }

  const tangentX = (vx - intoWall * normal.nx) * config.tangentDamp;
  const tangentY = (vy - intoWall * normal.ny) * config.tangentDamp;
  const bounce = Math.min(-intoWall * config.bounceRestitution, config.maxBounceSpeed);
  const rx = tangentX + normal.nx * bounce;
  const ry = tangentY + normal.ny * bounce;

  car.speed = Math.hypot(rx, ry);
  if (car.speed > 0.35) {
    car.heading = Math.atan2(ry, rx);
  } else {
    car.speed = 0;
  }
}

// Returns true when the car overlapped a wall this frame.
// Velocity changes once. Position is corrected up to four times so a corner
// (two walls at once) still pushes the car clear.
export function resolveCollisions(car, walls) {
  let bounceNormal = null;

  for (let pass = 0; pass < 4; pass += 1) {
    const hit = deepestOverlap(car, walls);
    if (!hit) {
      break;
    }
    car.x += hit.nx * (hit.penetration + 0.05);
    car.y += hit.ny * (hit.penetration + 0.05);
    if (!bounceNormal) {
      bounceNormal = hit;
    }
  }

  if (!bounceNormal) {
    return false;
  }

  applyBounce(car, bounceNormal);
  return true;
}
