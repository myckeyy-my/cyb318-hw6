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
import { buildTrack } from "../js/track.js";

globalThis.window = {
  devicePixelRatio: 1,
  addEventListener() {}
};
const { Game } = await import("../js/game.js");

const trackData = JSON.parse(
  readFileSync(new URL("../data/tracks.json", import.meta.url), "utf8")
);
const track = buildTrack(trackData.tracks[0]);

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
    track,
    { onUpdate() {}, ...hooks },
    {}
  );
}

test("all championship levels share the track and configured benchmarks", () => {
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
    ["prototype", "prototype", "prototype"]
  );
  assert.equal("benchmark" in track, false);
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

test("Next Round ends qualifying and level transitions reset session on the same track", () => {
  const game = createGame();
  const initialTrack = game.track;

  assert.equal(game.advanceLevel(), false);
  qualify(game);
  assert.equal(game.unlockedLevel, 2);
  game.player.speed = 10;
  assert.equal(game.advanceLevel(), true);
  assert.equal(game.currentLevel, 2);
  assert.equal(game.unlockedLevel, 2);
  assert.strictEqual(game.track, initialTrack);

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
  game.qualifying.handleCrossing(0);
  game.qualifying.handleCollision(1000);
  game.player.speed = 4;
  game.restart();
  const restartedSession = game.qualifying.snapshot(0);
  assert.equal(game.currentLevel, 2);
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
