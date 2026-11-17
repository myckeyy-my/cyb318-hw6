// Loads a circuit description from JSON and turns it into world geometry.
// The square prototype is stored as a few numbers (straight length, corner
// radius, width). This module samples that shape into a centerline, an inner
// wall, an outer wall, a start line, and a spawn pose.
// Gameplay code uses those points. It does not rebuild the square itself.

import { config } from "./config.js";

const GEOMETRY_EPSILON = 1e-7;

function pushPoint(points, x, y) {
  const last = points[points.length - 1];
  if (last && Math.hypot(last.x - x, last.y - y) < 0.05) {
    return;
  }
  points.push({ x, y });
}

function sampleStraight(points, x0, y0, x1, y1, spacing) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(1, Math.round(Math.hypot(dx, dy) / spacing));
  for (let i = 0; i < steps; i += 1) {
    const t = i / steps;
    pushPoint(points, x0 + dx * t, y0 + dy * t);
  }
}

function sampleArc(points, cx, cy, radius, a0, a1, spacing) {
  const steps = Math.max(1, Math.round((radius * (a1 - a0)) / spacing));
  for (let i = 0; i < steps; i += 1) {
    const angle = a0 + (a1 - a0) * (i / steps);
    pushPoint(points, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
}

function buildCenterline(spec) {
  const half = spec.straight / 2;
  const radius = spec.cornerRadius;
  const spacing = spec.sampleSpacing;
  const points = [];

  // Counterclockwise, starting at the west end of the south straight.
  sampleStraight(points, -half, -(half + radius), half, -(half + radius), spacing);
  sampleArc(points, half, -half, radius, -Math.PI / 2, 0, spacing);
  sampleStraight(points, half + radius, -half, half + radius, half, spacing);
  sampleArc(points, half, half, radius, 0, Math.PI / 2, spacing);
  sampleStraight(points, half, half + radius, -half, half + radius, spacing);
  sampleArc(points, -half, half, radius, Math.PI / 2, Math.PI, spacing);
  sampleStraight(points, -(half + radius), half, -(half + radius), -half, spacing);
  sampleArc(points, -half, -half, radius, Math.PI, Math.PI * 1.5, spacing);

  return points;
}

function offsetWalls(center, width) {
  const left = [];
  const right = [];
  const half = width / 2;
  const count = center.length;

  for (let i = 0; i < count; i += 1) {
    const prev = center[(i - 1 + count) % count];
    const next = center[(i + 1) % count];
    let tx = next.x - prev.x;
    let ty = next.y - prev.y;
    const length = Math.hypot(tx, ty) || 1;
    tx /= length;
    ty /= length;
    left.push({ x: center[i].x + -ty * half, y: center[i].y + tx * half });
    right.push({ x: center[i].x - -ty * half, y: center[i].y - tx * half });
  }

  return { left, right };
}

// inwardSign +1 uses the left normal of the travel direction.
// The outer wall's safe side is to the left. The inner wall's safe side is to the right.
function wallSegments(points, inwardSign) {
  const segments = [];
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    let tx = b.x - a.x;
    let ty = b.y - a.y;
    const length = Math.hypot(tx, ty) || 1;
    tx /= length;
    ty /= length;
    segments.push({
      a,
      b,
      nx: -ty * inwardSign,
      ny: tx * inwardSign
    });
  }
  return segments;
}

function angleDifference(from, to) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function interpolatePoint(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  };
}

function buildKerbs(centerline, asphaltEdges, kerbEdges, stripeLength) {
  const count = centerline.length;
  const headings = centerline.map((point, index) => {
    const next = centerline[(index + 1) % count];
    return Math.atan2(next.y - point.y, next.x - point.x);
  });
  const kerbs = [];
  let stripeIndex = 0;

  for (let index = 0; index < count; index += 1) {
    const nextIndex = (index + 1) % count;
    const turnAtStart = angleDifference(
      headings[(index - 1 + count) % count],
      headings[index]
    );
    const turnAtEnd = angleDifference(headings[index], headings[nextIndex]);
    if (Math.max(Math.abs(turnAtStart), Math.abs(turnAtEnd)) < 0.025) {
      continue;
    }

    const length = Math.hypot(
      centerline[nextIndex].x - centerline[index].x,
      centerline[nextIndex].y - centerline[index].y
    );
    const stripeCount = Math.max(1, Math.ceil(length / stripeLength));

    for (const side of ["left", "right"]) {
      for (let stripe = 0; stripe < stripeCount; stripe += 1) {
        const t0 = stripe / stripeCount;
        const t1 = (stripe + 1) / stripeCount;
        kerbs.push({
          color: stripeIndex % 2 === 0 ? "#f5f2e9" : "#df3b35",
          points: [
            interpolatePoint(asphaltEdges[side][index], asphaltEdges[side][nextIndex], t0),
            interpolatePoint(asphaltEdges[side][index], asphaltEdges[side][nextIndex], t1),
            interpolatePoint(kerbEdges[side][index], kerbEdges[side][nextIndex], t1),
            interpolatePoint(kerbEdges[side][index], kerbEdges[side][nextIndex], t0)
          ]
        });
        stripeIndex += 1;
      }
    }
  }

  return kerbs;
}

function pointOnSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    return Math.hypot(point.x - a.x, point.y - a.y) <= GEOMETRY_EPSILON;
  }
  const projection = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared)
  );
  const nearestX = a.x + dx * projection;
  const nearestY = a.y + dy * projection;
  return Math.hypot(point.x - nearestX, point.y - nearestY) <= GEOMETRY_EPSILON;
}

function isInsidePolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[j];
    const b = polygon[i];
    if (pointOnSegment(point, a, b)) {
      return true;
    }
    const crossesRay =
      (a.y > point.y) !== (b.y > point.y) &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (crossesRay) {
      inside = !inside;
    }
  }
  return inside;
}

function isOnPolygonBoundary(point, polygon) {
  for (let i = 0; i < polygon.length; i += 1) {
    if (pointOnSegment(point, polygon[i], polygon[(i + 1) % polygon.length])) {
      return true;
    }
  }
  return false;
}

export function isOnAsphalt(track, point) {
  const withinOuterEdge = isInsidePolygon(point, track.asphaltEdges.right);
  const insideInnerEdge = isInsidePolygon(point, track.asphaltEdges.left);
  const onInnerEdge = isOnPolygonBoundary(point, track.asphaltEdges.left);
  return withinOuterEdge && (!insideInnerEdge || onInnerEdge);
}

export function isOnKerb(track, point) {
  return track.kerbs.some((kerb) => isInsidePolygon(point, kerb.points));
}

export function isOnTrack(track, point) {
  return isOnAsphalt(track, point) || isOnKerb(track, point);
}

export function getTrackSurface(track, wheelPositions) {
  return Object.values(wheelPositions).every((wheel) =>
    isOnTrack(track, wheel)
  )
    ? "asphalt"
    : "runoff";
}

function nearestIndex(points, x, y) {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const distance = Math.hypot(points[i].x - x, points[i].y - y);
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }
  return best;
}

function validateSpec(spec) {
  if (spec.shape !== "rounded-rect") {
    throw new Error(`Track "${spec.id}" uses an unsupported shape.`);
  }
  if (!(spec.straight > 0) || !(spec.cornerRadius > 0) || !(spec.width > 0)) {
    throw new Error(`Track "${spec.id}" has invalid dimensions.`);
  }
  if (spec.width < 10) {
    throw new Error(`Track "${spec.id}" is narrower than the car can drive.`);
  }
  const runoffWidth = spec.runoffWidth ?? config.runoffWidth;
  const barrierWidth = spec.barrierWidth ?? config.barrierWidth;
  const kerbWidth = spec.kerbWidth ?? config.kerbWidth;
  const stripeLength = spec.kerbStripeLength ?? config.kerbStripeLength;
  if (
    !Number.isFinite(runoffWidth) ||
    runoffWidth <= 0 ||
    !Number.isFinite(barrierWidth) ||
    barrierWidth <= 0 ||
    !Number.isFinite(kerbWidth) ||
    kerbWidth <= 0 ||
    !Number.isFinite(stripeLength) ||
    stripeLength <= 0
  ) {
    throw new Error(`Track "${spec.id}" has invalid boundary dimensions.`);
  }
  if (spec.shape === "rounded-rect" && spec.cornerRadius <= spec.width / 2 + runoffWidth) {
    throw new Error(`Track "${spec.id}" has runoff that is too wide for its corner radius.`);
  }
  if (!Number.isFinite(spec.benchmark) || spec.benchmark <= 0) {
    throw new Error(`Track "${spec.id}" has an invalid qualifying benchmark.`);
  }
  if (spec.obstacles !== undefined && !Array.isArray(spec.obstacles)) {
    throw new Error(`Track "${spec.id}" has an invalid obstacle list.`);
  }
  if (
    spec.obstacles &&
    spec.obstacles.some(
      (obstacle) =>
        !Number.isFinite(obstacle.x) ||
        !Number.isFinite(obstacle.y) ||
        !Number.isFinite(obstacle.radius) ||
        obstacle.radius <= 0
    )
  ) {
    throw new Error(`Track "${spec.id}" has an invalid obstacle.`);
  }
}

export function buildTrack(spec) {
  validateSpec(spec);
  const centerline = buildCenterline(spec);
  const runoffWidth = spec.runoffWidth ?? config.runoffWidth;
  const barrierWidth = spec.barrierWidth ?? config.barrierWidth;
  const kerbWidth = spec.kerbWidth ?? config.kerbWidth;
  const asphaltEdges = offsetWalls(centerline, spec.width);
  const runoffEdges = offsetWalls(centerline, spec.width + runoffWidth * 2);
  const barrierEdges = offsetWalls(
    centerline,
    spec.width + (runoffWidth + barrierWidth / 2) * 2
  );
  const kerbEdges = offsetWalls(centerline, spec.width + kerbWidth * 2);
  const kerbs = buildKerbs(
    centerline,
    asphaltEdges,
    kerbEdges,
    spec.kerbStripeLength ?? config.kerbStripeLength
  );
  const half = spec.straight / 2;
  const startIndex = nearestIndex(centerline, 0, -(half + spec.cornerRadius));
  const spawnIndex = (startIndex - 2 + centerline.length) % centerline.length;
  const spawn = centerline[spawnIndex];
  const ahead = centerline[(spawnIndex + 1) % centerline.length];

  return {
    id: spec.id,
    name: spec.name,
    difficulty: spec.difficulty,
    benchmark: spec.benchmark,
    level: spec.level || 1,
    width: spec.width,
    runoffWidth,
    barrierWidth,
    kerbWidth,
    obstacles: (spec.obstacles || []).map((obstacle) => ({ ...obstacle })),
    centerline,
    leftWall: asphaltEdges.left,
    rightWall: asphaltEdges.right,
    asphaltEdges,
    runoffEdges,
    barrierEdges,
    kerbs,
    walls: [
      ...wallSegments(barrierEdges.right, 1),
      ...wallSegments(barrierEdges.left, -1)
    ],
    startIndex,
    startGate: {
      a: asphaltEdges.left[startIndex],
      b: asphaltEdges.right[startIndex]
    },
    spawn: {
      x: spawn.x,
      y: spawn.y,
      heading: Math.atan2(ahead.y - spawn.y, ahead.x - spawn.x)
    }
  };
}

export async function loadTrack(url, id) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Could not load ${url} (${response.status}). Open this project through a static file server, not as a file:// page.`
    );
  }
  const data = await response.json();
  const spec = (data.tracks || []).find((track) => track.id === id);
  if (!spec) {
    throw new Error(`Track "${id}" is missing from ${url}.`);
  }
  return buildTrack(spec);
}
