// Loads circuit descriptions and generates their world-space centerlines,
// boundaries, kerbs, start lines, and spawn poses.

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
  if (spec.shape === "spline") {
    return buildSplineCenterline(spec);
  }

  const halfX = (spec.straightX ?? spec.straight) / 2;
  const halfY = (spec.straightY ?? spec.straight) / 2;
  const radius = spec.cornerRadius;
  const spacing = spec.sampleSpacing;
  const points = [];

  // Counterclockwise, starting at the west end of the south straight.
  sampleStraight(
    points,
    -halfX,
    -(halfY + radius),
    halfX,
    -(halfY + radius),
    spacing
  );
  sampleArc(points, halfX, -halfY, radius, -Math.PI / 2, 0, spacing);
  sampleStraight(points, halfX + radius, -halfY, halfX + radius, halfY, spacing);
  sampleArc(points, halfX, halfY, radius, 0, Math.PI / 2, spacing);
  sampleStraight(
    points,
    halfX,
    halfY + radius,
    -halfX,
    halfY + radius,
    spacing
  );
  sampleArc(points, -halfX, halfY, radius, Math.PI / 2, Math.PI, spacing);
  sampleStraight(
    points,
    -(halfX + radius),
    halfY,
    -(halfX + radius),
    -halfY,
    spacing
  );
  sampleArc(points, -halfX, -halfY, radius, Math.PI, Math.PI * 1.5, spacing);

  return points;
}

function interpolateSplinePoint(p0, p1, p2, p3, amount) {
  const knotDistance = (a, b) => Math.sqrt(Math.hypot(b.x - a.x, b.y - a.y));
  const t0 = 0;
  const t1 = t0 + knotDistance(p0, p1);
  const t2 = t1 + knotDistance(p1, p2);
  const t3 = t2 + knotDistance(p2, p3);
  const t = t1 + (t2 - t1) * amount;
  const interpolate = (a, b, ta, tb) => ({
    x: ((tb - t) * a.x + (t - ta) * b.x) / (tb - ta),
    y: ((tb - t) * a.y + (t - ta) * b.y) / (tb - ta)
  });
  const a1 = interpolate(p0, p1, t0, t1);
  const a2 = interpolate(p1, p2, t1, t2);
  const a3 = interpolate(p2, p3, t2, t3);
  const b1 = interpolate(a1, a2, t0, t2);
  const b2 = interpolate(a2, a3, t1, t3);
  return interpolate(b1, b2, t1, t2);
}

function buildSplineCenterline(spec) {
  const points = spec.points;
  const centerline = [];

  for (let index = 0; index < points.length; index += 1) {
    const p0 = points[(index - 1 + points.length) % points.length];
    const p1 = points[index];
    const p2 = points[(index + 1) % points.length];
    const p3 = points[(index + 2) % points.length];
    const segmentLength = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const samples = Math.max(1, Math.ceil(segmentLength / spec.sampleSpacing));

    for (let sample = 0; sample < samples; sample += 1) {
      const point = interpolateSplinePoint(p0, p1, p2, p3, sample / samples);
      pushPoint(centerline, point.x, point.y);
    }
  }

  return centerline;
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
  if (spec.shape !== "rounded-rect" && spec.shape !== "spline") {
    throw new Error(`Track "${spec.id}" uses an unsupported shape.`);
  }
  if (!(spec.width > 0)) {
    throw new Error(`Track "${spec.id}" has invalid dimensions.`);
  }
  const straightX = spec.straightX ?? spec.straight;
  const straightY = spec.straightY ?? spec.straight;
  if (
    !Number.isFinite(spec.sampleSpacing) ||
    spec.sampleSpacing <= 0 ||
    (spec.shape === "rounded-rect" &&
      (!Number.isFinite(straightX) ||
        straightX <= 0 ||
        !Number.isFinite(straightY) ||
        straightY <= 0 ||
        !Number.isFinite(spec.cornerRadius) ||
        spec.cornerRadius <= 0))
  ) {
    throw new Error(`Track "${spec.id}" has invalid centerline dimensions.`);
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
  if (spec.shape === "spline") {
    if (
      !Array.isArray(spec.points) ||
      spec.points.length < 4 ||
      spec.points.some(
        (point) =>
          !point ||
          !Number.isFinite(point.x) ||
          !Number.isFinite(point.y)
      ) ||
      !spec.startPoint ||
      !Number.isFinite(spec.startPoint.x) ||
      !Number.isFinite(spec.startPoint.y)
    ) {
      throw new Error(`Track "${spec.id}" has an invalid spline centerline.`);
    }
    for (let index = 0; index < spec.points.length; index += 1) {
      const point = spec.points[index];
      const next = spec.points[(index + 1) % spec.points.length];
      if (Math.hypot(next.x - point.x, next.y - point.y) < 0.001) {
        throw new Error(`Track "${spec.id}" has duplicate spline points.`);
      }
    }
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
  const startIndex =
    spec.shape === "spline"
      ? nearestIndex(centerline, spec.startPoint.x, spec.startPoint.y)
      : nearestIndex(
          centerline,
          0,
          -((spec.straightY ?? spec.straight) / 2 + spec.cornerRadius)
        );
  const spawnIndex = (startIndex - 2 + centerline.length) % centerline.length;
  const spawn = centerline[spawnIndex];
  const ahead = centerline[(spawnIndex + 1) % centerline.length];

  return {
    id: spec.id,
    name: spec.name,
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
