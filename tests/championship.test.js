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

function minimumNonAdjacentSeparation(points, minimumIndexGap) {
  let minimum = Infinity;
  for (let first = 0; first < points.length; first += 1) {
    for (let second = first + 1; second < points.length; second += 1) {
      const gap = Math.min(second - first, points.length - (second - first));
      if (gap < minimumIndexGap) {
        continue;
      }
      const distance = Math.hypot(
        points[first].x - points[second].x,
        points[first].y - points[second].y
      );
      minimum = Math.min(minimum, distance);
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

function minimumCurveRadius(points) {
  let minimum = Infinity;
  for (let index = 0; index < points.length; index += 1) {
    const a = points[(index - 1 + points.length) % points.length];
    const b = points[index];
    const c = points[(index + 1) % points.length];
    const ab = Math.hypot(b.x - a.x, b.y - a.y);
    const bc = Math.hypot(c.x - b.x, c.y - b.y);
    const ca = Math.hypot(a.x - c.x, a.y - c.y);
    const twiceArea = Math.abs(
      (b.x - a.x) * (c.y - a.y) -
      (b.y - a.y) * (c.x - a.x)
    );
    if (twiceArea > 0) {
      minimum = Math.min(minimum, (ab * bc * ca) / (2 * twiceArea));
    }
  }
  return minimum;
}

test("championship levels use distinct tracks and configured benchmarks", () => {
  assert.deepEqual(
    championshipLevels.map(({ level, difficulty, targetLapTimeSeconds }) => ({
      level,
      difficulty,
      targetLapTimeSeconds
    })),
    [
      { level: 1, difficulty: "Easy", targetLapTimeSeconds: 45 },
      { level: 2, difficulty: "Medium", targetLapTimeSeconds: 38 },
      { level: 3, difficulty: "Hard", targetLapTimeSeconds: 32 }
    ]
  );
  assert.deepEqual(
    championshipLevels.map((level) => level.trackId),
    ["apex-circuit", "harbor-street", "velocity-gp"]
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
    assert.equal(updateLapDetector(detector, nextAfterLine), true);
    assert.equal(hasSelfIntersection(levelTrack.centerline), false);
    assert.equal(hasSelfIntersection(levelTrack.asphaltEdges.left), false);
    assert.equal(hasSelfIntersection(levelTrack.asphaltEdges.right), false);
  }
});

test("Harbor Street runoff and barriers do not cross or overlap nearby road sections", () => {
  const harborTrack = championshipTracks.get("harbor-street");
  for (const boundary of [
    harborTrack.runoffEdges.left,
    harborTrack.runoffEdges.right,
    harborTrack.barrierEdges.left,
    harborTrack.barrierEdges.right
  ]) {
    assert.equal(hasSelfIntersection(boundary), false);
  }

  const clearance = minimumNonAdjacentSeparation(harborTrack.centerline, 17);
  const boundaryEnvelope =
    harborTrack.width +
    2 * (harborTrack.runoffWidth + harborTrack.barrierWidth / 2);
  assert.ok(clearance > boundaryEnvelope);
});

test("Velocity GP has sharp corners and hard barriers clear of asphalt", () => {
  const velocityTrack = championshipTracks.get("velocity-gp");
  const barriers = [
    velocityTrack.barrierEdges.left,
    velocityTrack.barrierEdges.right
  ];
  const outerBorders = [
    velocityTrack.runoffEdges.left,
    velocityTrack.runoffEdges.right,
    ...barriers
  ];
  const asphaltEdges = [
    velocityTrack.asphaltEdges.left,
    velocityTrack.asphaltEdges.right
  ];

  for (const border of outerBorders) {
    assert.equal(hasSelfIntersection(border), false);
  }
  assert.equal(hasPathIntersection(barriers[0], barriers[1]), false);

  for (const barrier of barriers) {
    assert.equal(barrier.some((point) => isOnAsphalt(velocityTrack, point)), false);
    for (const asphaltEdge of asphaltEdges) {
      assert.equal(hasPathIntersection(barrier, asphaltEdge), false);
    }
  }

  const hardBorderOffset =
    velocityTrack.width / 2 +
    velocityTrack.runoffWidth +
    velocityTrack.barrierWidth / 2;
  const cornerRadius = minimumCurveRadius(velocityTrack.centerline);
  assert.ok(cornerRadius > hardBorderOffset);
  assert.ok(cornerRadius < 30);

  const boundaryEnvelope = hardBorderOffset * 2;
  assert.ok(
    minimumNonAdjacentSeparation(velocityTrack.centerline, 17) >
      boundaryEnvelope
  );
});

test("qualifying appears immediately and can continue until attempts run out", () => {
  const session = createQualifyingSession(track, 45);
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

test("qualifying unlocks the next level immediately", () => {
  const game = createGame();
  game.qualifying.handleCrossing(0);
  game.qualifying.handleCrossing(44000);
  game.update(0);

  assert.equal(game.unlockedLevel, 2);
  assert.equal(game.qualifying.snapshot(44000).state, qualifyingStates.LAP_RUNNING);
});

test("using all five attempts at the exact target time fails", () => {
  const session = createQualifyingSession(track, 45);
  session.handleCrossing(0);

  for (const lapEnd of [45000, 90000, 135000, 180000, 225000]) {
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
  assert.equal(game.track.id, "harbor-street");
  const levelTwoTrack = game.track;

  const levelTwo = game.qualifying.snapshot(0);
  assert.equal(levelTwo.targetLapTimeMs, 38000);
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
  assert.equal(game.qualifying.snapshot(0).targetLapTimeMs, 32000);
  qualify(game, 31000);

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
