// Turns a world position into a screen position.
// The car stays at the center. Its nose stays toward the top of the screen.
// Heading eases toward the car so a sharp turn does not snap the view.

export function createCamera(heading) {
  return { heading };
}

export function shortestAngleDelta(from, to) {
  let delta = to - from;
  while (delta > Math.PI) {
    delta -= Math.PI * 2;
  }
  while (delta < -Math.PI) {
    delta += Math.PI * 2;
  }
  return delta;
}

export function updateCamera(camera, targetHeading, turnRate, dt) {
  const delta = shortestAngleDelta(camera.heading, targetHeading);
  const blend = 1 - Math.exp(-turnRate * dt);
  camera.heading += delta * blend;
}

// World axes: +x east, +y north.
// Canvas axes: +x right, +y down. The scale(1, -1) flips world y into canvas y.
// The rotation then aims the car's forward vector at screen-up.
export function applyCamera(ctx, camera, car, viewWidth, viewHeight, metersVisible) {
  const zoom = viewHeight / metersVisible;
  ctx.translate(viewWidth / 2, viewHeight / 2);
  ctx.scale(zoom, zoom);
  ctx.rotate(camera.heading - Math.PI / 2);
  ctx.scale(1, -1);
  ctx.translate(-car.x, -car.y);
}
