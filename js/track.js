// Loads a circuit description from JSON and turns it into world geometry.
// The square prototype is stored as a few numbers (straight length, corner
// radius, width). This module samples that shape into a centerline, an inner
// wall, an outer wall, a start line, and a spawn pose.
// Gameplay code uses those points. It does not rebuild the square itself.

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
}

export function buildTrack(spec) {
  validateSpec(spec);
  const centerline = buildCenterline(spec);
  const walls = offsetWalls(centerline, spec.width);
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
    width: spec.width,
    centerline,
    leftWall: walls.left,
    rightWall: walls.right,
    walls: [
      ...wallSegments(walls.right, 1),
      ...wallSegments(walls.left, -1)
    ],
    startIndex,
    startGate: {
      a: walls.left[startIndex],
      b: walls.right[startIndex]
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
