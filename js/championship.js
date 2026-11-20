export const championshipLevels = Object.freeze([
  Object.freeze({
    level: 1,
    difficulty: "Easy",
    targetLapTimeSeconds: 45,
    trackId: "prototype"
  }),
  Object.freeze({
    level: 2,
    difficulty: "Medium",
    targetLapTimeSeconds: 38,
    trackId: "prototype"
  }),
  Object.freeze({
    level: 3,
    difficulty: "Hard",
    targetLapTimeSeconds: 32,
    trackId: "prototype"
  })
]);

export function getChampionshipLevel(level) {
  const configuration = championshipLevels[level - 1];
  if (!Number.isInteger(level) || !configuration || configuration.level !== level) {
    throw new Error(`Championship level "${level}" is not configured.`);
  }
  return configuration;
}
