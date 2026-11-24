import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  championshipLevels,
  getChampionshipLevel
} from "../js/championship.js";
import {
  createQualifyingSession,
  qualifyingStates
} from "../js/qualifying.js";
import {
  buildTrack,
  isOnAsphalt,
  isOnTrack
} from "../js/track.js";
import {
  createLapDetector,
  updateLapDetector
} from "../js/lap-detection.js";

globalThis.window = {
  devicePixelRatio: 1,
  addEventListener() {}
};
const { Game } = await import("../js/game.js");

const trackData = JSON.parse(
  readFileSync(new URL("../data/tracks.json", import.meta.url), "utf8")
);
const championshipTracks = new Map(
  [...new Set(championshipLevels.map((level) => level.trackId))].map(
    (id) => [
      id,
      buildTrack(trackData.tracks.find((spec) => spec.id === id))
    ]
  )
);
const track = championshipTracks.get(championshipLevels[0].trackId);

function qualify(game, lapTimeMs = 44000) {
  assert.equal(game.qualifying.handleCrossing(0), true);
  assert.equal(game.qualifying.handleCrossing(lapTimeMs), true);
  assert.equal(game.finishQualifying(), true);
}

function createGame(hooks = {}) {
  const canvas = {
    clientWidth: 640,
    clientHeight: 480,
    getContext: () => ({})
  };
  return new Game(
    canvas,
    championshipTracks,
    { onUpdate() {}, ...hooks },
    {}
  );
}

function hasSelfIntersection(points) {
  const cross = (a, b, point) =>
    (b.x - a.x) * (point.y - a.y) -
    (b.y - a.y) * (point.x - a.x);

  for (let first = 0; first < points.length; first += 1) {
    const a = points[first];
    const b = points[(first + 1) % points.length];
    for (let second = first + 2; second < points.length; second += 1) {
      if (first === 0 && second === points.length - 1) {
        continue;
      }
      const c = points[second];
      const d = points[(second + 1) % points.length];
      if (
        cross(a, b, c) * cross(a, b, d) < 0 &&
        cross(c, d, a) * cross(c, d, b) < 0
      ) {
        return true;
      }
    }
  }
  return false;
}

function pointToSegmentDistance(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared === 0
    ? 0
    : Math.max(
        0,
        Math.min(
          1,
          ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared
        )
      );
  return Math.hypot(
    point.x - (a.x + dx * projection),
    point.y - (a.y + dy * projection)
  );
}

function minimumPathSeparation(firstPath, secondPath) {
  let minimum = Infinity;
  for (let first = 0; first < firstPath.length; first += 1) {
    const a = firstPath[first];
    const b = firstPath[(first + 1) % firstPath.length];
    for (let second = 0; second < secondPath.length; second += 1) {
      const c = secondPath[second];
      const d = secondPath[(second + 1) % secondPath.length];
      minimum = Math.min(
        minimum,
        pointToSegmentDistance(a, c, d),
        pointToSegmentDistance(b, c, d),
        pointToSegmentDistance(c, a, b),
        pointToSegmentDistance(d, a, b)
      );
    }
  }
  return minimum;
}

function hasPathIntersection(firstPath, secondPath) {
  const cross = (a, b, point) =>
    (b.x - a.x) * (point.y - a.y) -
    (b.y - a.y) * (point.x - a.x);

  for (let first = 0; first < firstPath.length; first += 1) {
    const a = firstPath[first];
    const b = firstPath[(first + 1) % firstPath.length];
    for (let second = 0; second < secondPath.length; second += 1) {
      const c = secondPath[second];
      const d = secondPath[(second + 1) % secondPath.length];
      if (
        cross(a, b, c) * cross(a, b, d) < 0 &&
        cross(c, d, a) * cross(c, d, b) < 0
      ) {
        return true;
      }
    }
  }
  return false;
}

test("championship levels use distinct tracks and configured benchmarks", () => {
  assert.deepEqual(
    championshipLevels.map(({ level, difficulty, targetLapTimeSeconds }) => ({
      level,
      difficulty,
      targetLapTimeSeconds
    })),
    [
      { level: 1, difficulty: "Easy", targetLapTimeSeconds: 50 },
      { level: 2, difficulty: "Medium", targetLapTimeSeconds: 50 },
      { level: 3, difficulty: "Hard", targetLapTimeSeconds: 40 }
    ]
  );
  assert.deepEqual(
    championshipLevels.map((level) => level.trackId),
    ["prototype", "silverstone", "velocity-gp"]
  );
  assert.equal(new Set(championshipLevels.map((level) => level.trackId)).size, 3);
  const prototype = buildTrack(
    trackData.tracks.find((spec) => spec.id === "prototype")
  );
  assert.deepEqual(
    [...championshipTracks.values()].map((levelTrack) => levelTrack.width),
    [16, 16, 16]
  );
  assert.equal(prototype.width, 16);
  assert.equal(
    [...championshipTracks.values()].every(
      (levelTrack) => levelTrack.centerline.length > 100
    ),
    true
  );
  assert.equal(
    [...championshipTracks.values()].every(
      (levelTrack) => !("benchmark" in levelTrack)
    ),
    true
  );
});

test("track validation bounds coordinates, point counts, and geometry work", () => {
  const silverstoneSpec = () =>
    JSON.parse(JSON.stringify(
      trackData.tracks.find((spec) => spec.id === "silverstone")
    ));

  const oversizedCoordinate = silverstoneSpec();
  oversizedCoordinate.points[0].x = 1001;
  assert.throws(
    () => buildTrack(oversizedCoordinate),
    /invalid spline centerline/
  );

  const tooManyPoints = silverstoneSpec();
  tooManyPoints.points = Array.from({ length: 129 }, (_, index) => ({
    x: index,
    y: 0
  }));
  assert.throws(
    () => buildTrack(tooManyPoints),
    /invalid spline centerline/
  );

  const excessiveGeometry = silverstoneSpec();
  excessiveGeometry.sampleSpacing = 0.25;
  excessiveGeometry.points = Array.from({ length: 128 }, (_, index) => {
    const angle = (index / 128) * Math.PI * 2;
    return { x: Math.cos(angle) * 900, y: Math.sin(angle) * 900 };
  });
  assert.throws(
    () => buildTrack(excessiveGeometry),
    /too many centerline samples/
  );

  const invalidSampling = trackData.tracks.find(
    (spec) => spec.id === "prototype"
  );
  assert.throws(
    () => buildTrack({ ...invalidSampling, straight: 1001 }),
    /invalid centerline dimensions/
  );
  assert.throws(
    () => buildTrack({ ...invalidSampling, sampleSpacing: 0.1 }),
    /invalid centerline dimensions/
  );
});

test("each fictional circuit supports asphalt driving and a forward start-line crossing", () => {
  for (const levelTrack of championshipTracks.values()) {
    const detector = createLapDetector(levelTrack, levelTrack.spawn);
    const nextAfterLine =
      levelTrack.centerline[
        (levelTrack.startIndex + 1) % levelTrack.centerline.length
      ];

    assert.equal(isOnTrack(levelTrack, levelTrack.spawn), true);
    assert.equal(
      isOnTrack(levelTrack, levelTrack.centerline[levelTrack.startIndex]),
      true
    );
    assert.equal(detector.armed, true);
    assert.equal(updateLapDetector(detector, nextAfterLine), "forward");
    assert.equal(hasSelfIntersection(levelTrack.centerline), false);
    assert.equal(hasSelfIntersection(levelTrack.asphaltEdges.left), false);
    assert.equal(hasSelfIntersection(levelTrack.asphaltEdges.right), false);
  }
});

test("lap detector reports reverse start-line crossings", () => {
  const detector = createLapDetector(track, track.spawn);
  const alongNormal = (distance) => ({
    x: detector.center.x + detector.normal.x * distance,
    y: detector.center.y + detector.normal.y * distance
  });

  assert.equal(updateLapDetector(detector, alongNormal(5)), "forward");
  assert.equal(updateLapDetector(detector, alongNormal(-5)), "reverse");
  assert.equal(updateLapDetector(detector, alongNormal(5)), "forward");
});

test("Silverstone is a dynamic spline with six chicanes and two 180-degree turns", () => {
  const silverstone = championshipTracks.get("silverstone");
  assert.equal(silverstone.obstacles.length, 7);
  assert.equal(silverstone.chicaneCount, 6);
  assert.equal(silverstone.hairpinCount, 2);
  assert.equal(silverstone.centerline.length > 300, true);
  assert.equal(isOnTrack(silverstone, silverstone.spawn), true);
  for (const obstacle of silverstone.obstacles) {
    assert.equal(isOnAsphalt(silverstone, obstacle), true);
  }
});

test("Velocity GP has more chicanes and a tighter footprint than Silverstone", () => {
  const silverstone = championshipTracks.get("silverstone");
  const velocity = championshipTracks.get("velocity-gp");
  assert.equal(velocity.chicaneCount, 8);
  assert.equal(velocity.chicaneCount > silverstone.chicaneCount, true);
  assert.equal(velocity.hairpinCount, 2);
  assert.equal(velocity.obstacles.length, 5);
  for (const [index, obstacle] of velocity.obstacles.entries()) {
    assert.equal(isOnAsphalt(velocity, obstacle), true);
    for (const asphaltEdge of [
      velocity.asphaltEdges.left,
      velocity.asphaltEdges.right
    ]) {
      assert.ok(
        minimumPathSeparation([obstacle], asphaltEdge) > obstacle.radius
      );
    }
    assert.ok(
      Math.hypot(
        obstacle.x - velocity.spawn.x,
        obstacle.y - velocity.spawn.y
      ) > 20
    );
    for (const other of velocity.obstacles.slice(index + 1)) {
      assert.ok(
        Math.hypot(obstacle.x - other.x, obstacle.y - other.y) >
          obstacle.radius + other.radius
      );
    }
  }
  const ySpan = (track) => {
    const values = track.centerline.map((point) => point.y);
    return Math.max(...values) - Math.min(...values);
  };
  assert.equal(ySpan(velocity) < ySpan(silverstone), true);
  assert.equal(isOnTrack(velocity, velocity.spawn), true);
});

test("hard borders stay clear of asphalt through chicanes and hairpins", () => {
  for (const track of championshipTracks.values()) {
    const asphaltEdges = [
      track.asphaltEdges.left,
      track.asphaltEdges.right
    ];
    const hardBorders = [
      track.barrierEdges.left,
      track.barrierEdges.right
    ];

    for (const border of hardBorders) {
      assert.equal(hasSelfIntersection(border), false);
      assert.equal(border.some((point) => isOnAsphalt(track, point)), false);
      for (const asphaltEdge of asphaltEdges) {
        assert.equal(hasPathIntersection(border, asphaltEdge), false);
        assert.ok(
          minimumPathSeparation(border, asphaltEdge) > track.barrierWidth / 2
        );
      }
    }
  }
});

test("qualifying appears immediately and can continue until attempts run out", () => {
  const session = createQualifyingSession(track, 50);
  session.handleCrossing(0);
  session.handleCrossing(44000);

  let result = session.snapshot(44000);
  assert.equal(result.qualified, true);
  assert.equal(result.status, "QUALIFIED");
  assert.equal(result.state, qualifyingStates.LAP_RUNNING);
  assert.equal(result.attemptsRemaining, 4);

  for (const lapEnd of [94000, 144000, 194000, 244000]) {
    session.handleCrossing(lapEnd);
  }

  result = session.snapshot(244000);
  assert.equal(result.state, qualifyingStates.SESSION_COMPLETED);
  assert.equal(result.result, "QUALIFIED");
  assert.equal(result.attemptsRemaining, 0);
});

test("wrong-way crossing requires two forward crossings before lap completion", () => {
  const session = createQualifyingSession(track, 50);
  session.handleCrossing(0);
  assert.equal(session.handleWrongWayCrossing(1000), true);

  assert.equal(session.handleCrossing(20000), false);
  let result = session.snapshot(20000);
  assert.equal(result.state, qualifyingStates.LAP_RUNNING);
  assert.equal(result.validLaps, 0);
  assert.equal(result.wrongWayRecoveryRequired, true);
  assert.equal(result.wrongWayRecoveryCrossings, 1);

  assert.equal(session.handleCrossing(45000), true);
  result = session.snapshot(45000);
  assert.equal(result.state, qualifyingStates.LAP_RUNNING);
  assert.equal(result.validLaps, 1);
  assert.equal(result.fastestValidLapMs, 45000);
  assert.equal(result.qualified, true);
  assert.equal(result.wrongWayRecoveryRequired, false);
});

test("another wrong-way crossing restarts forward-crossing recovery", () => {
  const session = createQualifyingSession(track, 50);
  session.handleCrossing(0);
  session.handleWrongWayCrossing(1000);
  session.handleCrossing(20000);
  session.handleWrongWayCrossing(21000);

  const result = session.snapshot(21000);
  assert.equal(result.wrongWayRecoveryRequired, true);
  assert.equal(result.wrongWayRecoveryCrossings, 0);
  assert.equal(result.validLaps, 0);
});

test("qualifying unlocks the next level immediately", () => {
  const game = createGame();
  game.qualifying.handleCrossing(0);
  game.qualifying.handleCrossing(44000);
  game.update(0);

  assert.equal(game.unlockedLevel, 2);
  assert.equal(game.qualifying.snapshot(44000).state, qualifyingStates.LAP_RUNNING);
});

test("using all five attempts at the exact target time fails", () => {
  const session = createQualifyingSession(track, 50);
  session.handleCrossing(0);

  for (const lapEnd of [50000, 100000, 150000, 200000, 250000]) {
    session.handleCrossing(lapEnd);
  }

  const result = session.snapshot(225000);
  assert.equal(result.state, qualifyingStates.SESSION_COMPLETED);
  assert.equal(result.result, "FAILED");
  assert.equal(result.qualified, false);
  assert.equal(result.attemptsRemaining, 0);
});

test("Next Round loads the next track and resets the qualifying session", () => {
  const game = createGame();
  const initialTrack = game.track;

  assert.equal(game.advanceLevel(), false);
  qualify(game);
  assert.equal(game.unlockedLevel, 2);
  game.player.speed = 10;
  assert.equal(game.advanceLevel(), true);
  assert.equal(game.currentLevel, 2);
  assert.equal(game.unlockedLevel, 2);
  assert.notStrictEqual(game.track, initialTrack);
  assert.equal(game.track.id, "silverstone");
  const levelTwoTrack = game.track;

  const levelTwo = game.qualifying.snapshot(0);
  assert.equal(levelTwo.targetLapTimeMs, 50000);
  assert.equal(game.tutorialOpen, true);
  assert.equal(levelTwo.attemptsRemaining, 5);
  assert.equal(levelTwo.fastestValidLapMs, null);
  assert.equal(levelTwo.validLaps, 0);
  assert.equal(levelTwo.invalidLaps, 0);
  assert.equal(levelTwo.state, qualifyingStates.WAITING_FOR_START);
  assert.equal(game.player.speed, 0);

  assert.equal(game.advanceLevel(), false);
  game.restart();
  assert.equal(game.currentLevel, 2);
  assert.equal(game.unlockedLevel, 2);
  assert.strictEqual(game.track, levelTwoTrack);
  game.qualifying.handleCrossing(0);
  game.qualifying.handleCollision(1000);
  game.player.speed = 4;
  game.restart();
  const restartedSession = game.qualifying.snapshot(0);
  assert.equal(game.currentLevel, 2);
  assert.strictEqual(game.track, levelTwoTrack);
  assert.equal(restartedSession.attemptsRemaining, 5);
  assert.equal(restartedSession.fastestValidLapMs, null);
  assert.equal(restartedSession.validLaps, 0);
  assert.equal(restartedSession.invalidLaps, 0);
  assert.equal(game.player.speed, 0);
  assert.equal(
    restartedSession.targetLapTimeMs,
    getChampionshipLevel(2).targetLapTimeSeconds * 1000
  );
});

test("Level 3 qualification displays victory instead of advancing further", () => {
  let victories = 0;
  const game = createGame({ onVictory() { victories += 1; } });
  qualify(game);
  game.advanceLevel();
  qualify(game, 37000);
  game.advanceLevel();

  assert.equal(game.currentLevel, 3);
  assert.equal(game.track.id, "velocity-gp");
  assert.equal(game.qualifying.snapshot(0).targetLapTimeMs, 40000);
  qualify(game, 39000);

  assert.equal(game.advanceLevel(), true);
  assert.equal(game.currentLevel, 3);
  assert.equal(game.championshipWon, true);
  assert.equal(victories, 1);
  assert.equal(game.advanceLevel(), false);

  game.restartChampionship();
  assert.equal(game.currentLevel, 1);
  assert.equal(game.unlockedLevel, 1);
  assert.equal(game.championshipWon, false);
});
