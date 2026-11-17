// Tuning values for the car and the camera.
// Change these here instead of scattering numbers through the update loop.
// Distances are meters. Time is seconds. Angles are radians.

export const config = {
  acceleration: 12,
  brake: 24,
  friction: 5,
  maxSpeed: 32,
  steerSpeed: 2.2,
  minSteerFactor: 0.32,
  steerReferenceSpeed: 7,
  minSteerAtStop: 0.2,
  carRadius: 2.15,
  carLength: 4.6,
  bounceRestitution: 0.45,
  maxBounceSpeed: 6.5,
  tangentDamp: 0.55,
  cameraTurnRate: 9,
  cameraViewHeight: 72,
  maxDeltaTime: 0.05
};
