function signedDistance(position, detector) {
  return (
    (position.x - detector.center.x) * detector.normal.x +
    (position.y - detector.center.y) * detector.normal.y
  );
}

function isWithinGate(position, detector) {
  const dx = detector.gate.b.x - detector.gate.a.x;
  const dy = detector.gate.b.y - detector.gate.a.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection =
    ((position.x - detector.gate.a.x) * dx +
      (position.y - detector.gate.a.y) * dy) /
    lengthSquared;
  return projection >= 0 && projection <= 1;
}

function savePosition(detector, position) {
  detector.previous = { x: position.x, y: position.y };
  detector.previousDistance = signedDistance(position, detector);
}

export function createLapDetector(track, position, rearmDistance = 1) {
  const before = track.centerline[
    (track.startIndex - 1 + track.centerline.length) % track.centerline.length
  ];
  const after = track.centerline[(track.startIndex + 1) % track.centerline.length];
  const tangentX = after.x - before.x;
  const tangentY = after.y - before.y;
  const tangentLength = Math.hypot(tangentX, tangentY) || 1;
  const center = {
    x: (track.startGate.a.x + track.startGate.b.x) / 2,
    y: (track.startGate.a.y + track.startGate.b.y) / 2
  };
  const detector = {
    center,
    normal: { x: tangentX / tangentLength, y: tangentY / tangentLength },
    gate: track.startGate,
    rearmDistance,
    armed: false,
    previous: null,
    previousDistance: 0
  };

  detector.armed = signedDistance(position, detector) < -rearmDistance;
  savePosition(detector, position);
  return detector;
}

export function synchronizeLapDetector(detector, position) {
  const distance = signedDistance(position, detector);
  if (distance < -detector.rearmDistance) {
    detector.armed = true;
  }
  savePosition(detector, position);
}

export function updateLapDetector(detector, position) {
  const distance = signedDistance(position, detector);

  if (!detector.armed && distance < -detector.rearmDistance) {
    detector.armed = true;
  }

  const crossedForward =
    detector.previousDistance < 0 && distance >= 0;
  const crossedReverse =
    detector.previousDistance > 0 && distance <= 0;
  if (!crossedForward && !crossedReverse) {
    savePosition(detector, position);
    return null;
  }

  const fraction =
    detector.previousDistance /
    (detector.previousDistance - distance);
  const crossing = {
    x:
      detector.previous.x +
      (position.x - detector.previous.x) * fraction,
    y:
      detector.previous.y +
      (position.y - detector.previous.y) * fraction
  };

  savePosition(detector, position);
  if (!isWithinGate(crossing, detector)) {
    return null;
  }

  if (crossedReverse) {
    return "reverse";
  }
  if (!detector.armed) {
    return null;
  }

  detector.armed = false;
  return "forward";
}
