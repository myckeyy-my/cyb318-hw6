import { config } from "./config.js";

// Drawing only. Positions are world meters, already inside the camera transform.

function strokeLoop(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawStartLine(ctx, track) {
  const a = track.startGate.a;
  const b = track.startGate.b;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const px = -dy / length;
  const py = dx / length;
  const blocks = 10;
  const depth = 0.7;

  for (let i = 0; i < blocks; i += 1) {
    const t0 = i / blocks;
    const t1 = (i + 1) / blocks;
    const x0 = a.x + dx * t0;
    const y0 = a.y + dy * t0;
    const x1 = a.x + dx * t1;
    const y1 = a.y + dy * t1;
    ctx.fillStyle = i % 2 === 0 ? "#f5f5f5" : "#161616";
    ctx.beginPath();
    ctx.moveTo(x0 - px * depth, y0 - py * depth);
    ctx.lineTo(x1 - px * depth, y1 - py * depth);
    ctx.lineTo(x1 + px * depth, y1 + py * depth);
    ctx.lineTo(x0 + px * depth, y0 + py * depth);
    ctx.closePath();
    ctx.fill();
  }
}

function drawObstacles(ctx, obstacles) {
  for (const obstacle of obstacles) {
    ctx.fillStyle = "#ff9d2e";
    ctx.beginPath();
    ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#fff1d6";
    ctx.lineWidth = 0.2;
    ctx.beginPath();
    ctx.arc(obstacle.x, obstacle.y, obstacle.radius * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function fillKerbs(ctx, kerbs) {
  for (const kerb of kerbs) {
    ctx.fillStyle = kerb.color;
    ctx.beginPath();
    ctx.moveTo(kerb.points[0].x, kerb.points[0].y);
    for (let i = 1; i < kerb.points.length; i += 1) {
      ctx.lineTo(kerb.points[i].x, kerb.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function drawBarriers(ctx, track) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#272a30";
  ctx.lineWidth = track.barrierWidth;
  strokeLoop(ctx, track.barrierEdges.left);
  strokeLoop(ctx, track.barrierEdges.right);

  ctx.strokeStyle = "#aeb3ba";
  ctx.lineWidth = 0.24;
  strokeLoop(ctx, track.barrierEdges.left);
  strokeLoop(ctx, track.barrierEdges.right);
}

export function drawTrack(ctx, track) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.strokeStyle = "#243028";
  ctx.lineWidth =
    track.width + 2 * (track.runoffWidth + track.barrierWidth + 4);
  strokeLoop(ctx, track.centerline);

  ctx.strokeStyle = "#c5a36d";
  ctx.lineWidth = track.width + track.runoffWidth * 2;
  strokeLoop(ctx, track.centerline);

  ctx.strokeStyle = "#3c414c";
  ctx.lineWidth = track.width;
  strokeLoop(ctx, track.centerline);

  fillKerbs(ctx, track.kerbs);

  ctx.strokeStyle = "#f2f2f2";
  ctx.lineWidth = 0.55;
  strokeLoop(ctx, track.asphaltEdges.left);
  strokeLoop(ctx, track.asphaltEdges.right);

  ctx.save();
  ctx.strokeStyle = "#d8d8d8";
  ctx.lineWidth = 0.28;
  ctx.setLineDash([2.4, 3.2]);
  strokeLoop(ctx, track.centerline);
  ctx.restore();

  drawStartLine(ctx, track);
  drawObstacles(ctx, track.obstacles);
  drawBarriers(ctx, track);
}

const CAR_IMAGE_SIZE = 512;
const WHEEL_CROPS = [
  { x: 324, y: 73, centerX: 356, centerY: 105, front: true },
  { x: 124, y: 73, centerX: 156, centerY: 105, front: true },
  { x: 324, y: 391, centerX: 356, centerY: 423, front: false },
  { x: 124, y: 391, centerX: 156, centerY: 423, front: false }
];
const WHEEL_CROP_SIZE = 64;

export function createCarSprites(image) {
  if (
    image.naturalWidth !== CAR_IMAGE_SIZE ||
    image.naturalHeight !== CAR_IMAGE_SIZE
  ) {
    throw new Error("The car image must be a 512x512 PNG.");
  }

  const body = document.createElement("canvas");
  body.width = image.naturalWidth;
  body.height = image.naturalHeight;
  const bodyContext = body.getContext("2d");
  if (!bodyContext) {
    throw new Error("Could not prepare the car image.");
  }
  bodyContext.drawImage(image, 0, 0);

  // The source faces up; rotate it so its nose follows the car's local +x axis.
  const scale = config.carLength / CAR_IMAGE_SIZE;
  const wheelSprites = WHEEL_CROPS.map((wheel) => {
    const tire = document.createElement("canvas");
    tire.width = WHEEL_CROP_SIZE;
    tire.height = WHEEL_CROP_SIZE;
    const tireContext = tire.getContext("2d");
    if (!tireContext) {
      throw new Error("Could not prepare the car wheel image.");
    }
    tireContext.drawImage(
      image,
      wheel.x,
      wheel.y,
      WHEEL_CROP_SIZE,
      WHEEL_CROP_SIZE,
      0,
      0,
      WHEEL_CROP_SIZE,
      WHEEL_CROP_SIZE
    );

    return {
      image: tire,
      front: wheel.front,
      x: (CAR_IMAGE_SIZE / 2 - wheel.centerY) * scale,
      y: (wheel.centerX - CAR_IMAGE_SIZE / 2) * scale
    };
  });

  bodyContext.save();
  bodyContext.globalCompositeOperation = "destination-out";
  // Remove the baked tires so the cropped wheel sprites can steer independently.
  for (const wheel of WHEEL_CROPS) {
    bodyContext.beginPath();
    bodyContext.roundRect(wheel.centerX - 29, wheel.centerY - 29, 58, 58, 14);
    bodyContext.fill();
  }
  bodyContext.restore();

  return { body, wheels: wheelSprites, scale };
}

export function drawCar(ctx, car, sprites) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.heading);

  if (sprites) {
    const imageSize = config.carLength;
    ctx.save();
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(sprites.body, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.restore();

    for (const wheel of sprites.wheels) {
      ctx.save();
      ctx.translate(wheel.x, wheel.y);
      if (wheel.front) {
        ctx.rotate(car.steering || 0);
      }
      const wheelSize = WHEEL_CROP_SIZE * sprites.scale;
      ctx.drawImage(
        wheel.image,
        -wheelSize / 2,
        -wheelSize / 2,
        wheelSize,
        wheelSize
      );
      ctx.restore();
    }
  } else {
    ctx.fillStyle = "#ff3b30";
    ctx.beginPath();
    ctx.moveTo(2.55, 0);
    ctx.lineTo(1.15, 0.52);
    ctx.lineTo(-1.55, 0.82);
    ctx.lineTo(-2.05, 0.32);
    ctx.lineTo(-2.05, -0.32);
    ctx.lineTo(-1.55, -0.82);
    ctx.lineTo(1.15, -0.52);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
