export const championshipLevels = Object.freeze([
  Object.freeze({
    level: 1,
    difficulty: "Easy",
    targetLapTimeSeconds: 45,
    trackId: "apex-circuit"
  }),
  Object.freeze({
    level: 2,
    difficulty: "Medium",
    targetLapTimeSeconds: 38,
    trackId: "harbor-street"
  }),
  Object.freeze({
    level: 3,
    difficulty: "Hard",
    targetLapTimeSeconds: 32,
    trackId: "velocity-gp"
  })
]);

export function getChampionshipLevel(level) {
  const configuration = championshipLevels[level - 1];
  if (!Number.isInteger(level) || !configuration || configuration.level !== level) {
    throw new Error(`Championship level "${level}" is not configured.`);
  }
  return configuration;
}
