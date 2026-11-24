export const qualifyingStates = {
  WAITING_FOR_START: "WAITING_FOR_START",
  LAP_RUNNING: "LAP_RUNNING",
  LAP_INVALID: "LAP_INVALID",
  SESSION_COMPLETED: "SESSION_COMPLETED"
};

export function formatLapTime(milliseconds) {
  if (milliseconds === null || !Number.isFinite(milliseconds)) {
    return "--:---";
  }

  const totalMilliseconds = Math.max(0, Math.floor(milliseconds));
  const minutes = Math.floor(totalMilliseconds / 60000);
  const seconds = Math.floor(totalMilliseconds / 1000) % 60;
  const remainder = totalMilliseconds % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(remainder).padStart(3, "0")}`;
}

export function createQualifyingSession(track, targetLapTimeSeconds) {
  if (!Number.isFinite(targetLapTimeSeconds) || targetLapTimeSeconds <= 0) {
    throw new Error(`Track "${track.id}" has an invalid qualifying benchmark.`);
  }

  const totalAttempts = 5;
  const session = {
    state: qualifyingStates.WAITING_FOR_START,
    result: null,
    qualified: false,
    statusMessage: null,
    statusMessageUntil: 0,
    totalAttempts,
    attemptsRemaining: totalAttempts,
    attemptsCompleted: 0,
    currentAttempt: 0,
    validLaps: 0,
    invalidLaps: 0,
    fastestValidLapMs: null,
    targetLapTimeMs: targetLapTimeSeconds * 1000,
    lastLapTimeMs: null,
    lapStartedAt: null,
    wrongWayRecoveryRequired: false,
    wrongWayRecoveryCrossings: 0
  };

  function startLap(now, status) {
    if (
      session.attemptsRemaining <= 0 ||
      session.state === qualifyingStates.SESSION_COMPLETED
    ) {
      return false;
    }

    session.wrongWayRecoveryRequired = false;
    session.wrongWayRecoveryCrossings = 0;
    session.state = qualifyingStates.LAP_RUNNING;
    session.currentAttempt = session.attemptsCompleted + 1;
    session.lapStartedAt = now;
    session.statusMessage = status;
    session.statusMessageUntil = now + 2000;
    return true;
  }

  function completeSession() {
    session.state = qualifyingStates.SESSION_COMPLETED;
    session.lapStartedAt = null;
    session.result = session.qualified ? "QUALIFIED" : "FAILED";
    session.statusMessage = null;
  }

  function updateQualification() {
    session.qualified =
      session.fastestValidLapMs !== null &&
      session.fastestValidLapMs < session.targetLapTimeMs;
  }

  function consumeAttempt() {
    session.attemptsCompleted += 1;
    session.attemptsRemaining -= 1;
  }

  function handleCrossing(now) {
    if (session.state === qualifyingStates.SESSION_COMPLETED) {
      return false;
    }

    if (
      session.state === qualifyingStates.LAP_RUNNING &&
      session.wrongWayRecoveryRequired
    ) {
      session.wrongWayRecoveryCrossings += 1;
      if (session.wrongWayRecoveryCrossings < 2) {
        session.statusMessage = "RECOVERY: ONE MORE FORWARD CROSSING REQUIRED";
        session.statusMessageUntil = now + 2000;
        return false;
      }

      session.wrongWayRecoveryRequired = false;
      session.wrongWayRecoveryCrossings = 0;
    }

    if (
      session.state === qualifyingStates.WAITING_FOR_START ||
      session.state === qualifyingStates.LAP_INVALID
    ) {
      return startLap(now, "LAP STARTED");
    }

    if (session.state !== qualifyingStates.LAP_RUNNING) {
      return false;
    }

    const lapTime = Math.max(0, now - session.lapStartedAt);
    session.lastLapTimeMs = lapTime;
    session.lapStartedAt = null;
    session.validLaps += 1;
    consumeAttempt();

    if (
      session.fastestValidLapMs === null ||
      lapTime < session.fastestValidLapMs
    ) {
      session.fastestValidLapMs = lapTime;
    }
    updateQualification();

    if (session.attemptsRemaining === 0) {
      completeSession();
      return true;
    }

    startLap(now, "LAP COMPLETED");
    return true;
  }

  function handleWrongWayCrossing(now) {
    if (session.state !== qualifyingStates.LAP_RUNNING) {
      return false;
    }

    session.wrongWayRecoveryRequired = true;
    session.wrongWayRecoveryCrossings = 0;
    session.statusMessage = "WRONG-WAY CROSSING: TWO FORWARD CROSSINGS REQUIRED";
    session.statusMessageUntil = now + 2000;
    return true;
  }

  function handleInvalidation(now, status) {
    if (session.state !== qualifyingStates.LAP_RUNNING) {
      return false;
    }

    session.lastLapTimeMs = Math.max(0, now - session.lapStartedAt);
    session.lapStartedAt = null;
    session.wrongWayRecoveryRequired = false;
    session.wrongWayRecoveryCrossings = 0;
    session.invalidLaps += 1;
    consumeAttempt();

    if (session.attemptsRemaining === 0) {
      completeSession();
    } else {
      session.state = qualifyingStates.LAP_INVALID;
      session.statusMessage = status;
      session.statusMessageUntil = now + 2000;
    }
    return true;
  }

  function handleCollision(now) {
    return handleInvalidation(now, "INVALID LAP");
  }

  function handleTrackLimitViolation(now) {
    return handleInvalidation(now, "TRACK LIMITS — LAP INVALID");
  }

  function snapshot(now) {
    const currentLapTimeMs =
      session.state === qualifyingStates.LAP_RUNNING
        ? Math.max(0, now - session.lapStartedAt)
        : session.lastLapTimeMs;

    let phaseStatus = "READY";
    if (session.state === qualifyingStates.LAP_RUNNING) {
      phaseStatus = "LAP RUNNING";
    } else if (session.state === qualifyingStates.LAP_INVALID) {
      phaseStatus = "INVALID LAP";
    } else if (session.state === qualifyingStates.SESSION_COMPLETED) {
      phaseStatus =
        session.result === "QUALIFIED" ? "QUALIFIED" : "QUALIFICATION FAILED";
    }

    return {
      state: session.state,
      result: session.result,
      qualified: session.qualified,
      status: session.qualified
        ? "QUALIFIED"
        : session.statusMessage && now < session.statusMessageUntil
          ? session.statusMessage
          : phaseStatus,
      totalAttempts: session.totalAttempts,
      attemptsRemaining: session.attemptsRemaining,
      attemptsCompleted: session.attemptsCompleted,
      currentAttempt: session.currentAttempt,
      validLaps: session.validLaps,
      invalidLaps: session.invalidLaps,
      fastestValidLapMs: session.fastestValidLapMs,
      targetLapTimeMs: session.targetLapTimeMs,
      currentLapTimeMs,
      wrongWayRecoveryRequired: session.wrongWayRecoveryRequired,
      wrongWayRecoveryCrossings: session.wrongWayRecoveryCrossings
    };
  }

  function finish() {
    if (
      !session.qualified ||
      session.state === qualifyingStates.SESSION_COMPLETED
    ) {
      return false;
    }
    completeSession();
    return true;
  }

  function reset() {
    session.state = qualifyingStates.WAITING_FOR_START;
    session.result = null;
    session.qualified = false;
    session.statusMessage = null;
    session.statusMessageUntil = 0;
    session.attemptsRemaining = totalAttempts;
    session.attemptsCompleted = 0;
    session.currentAttempt = 0;
    session.validLaps = 0;
    session.invalidLaps = 0;
    session.fastestValidLapMs = null;
    session.lastLapTimeMs = null;
    session.lapStartedAt = null;
    session.wrongWayRecoveryRequired = false;
    session.wrongWayRecoveryCrossings = 0;
  }

  return {
    handleCrossing,
    handleWrongWayCrossing,
    handleCollision,
    handleTrackLimitViolation,
    snapshot,
    finish,
    reset
  };
}
