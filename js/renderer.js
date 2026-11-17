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

export function drawTrack(ctx, track) {
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.strokeStyle = "#243028";
  ctx.lineWidth = track.width + 8;
  strokeLoop(ctx, track.centerline);

  ctx.strokeStyle = "#8f2424";
  ctx.lineWidth = track.width + 1.6;
  strokeLoop(ctx, track.centerline);

  ctx.strokeStyle = "#3c414c";
  ctx.lineWidth = track.width;
  strokeLoop(ctx, track.centerline);

  ctx.strokeStyle = "#f2f2f2";
  ctx.lineWidth = 0.55;
  strokeLoop(ctx, track.leftWall);
  strokeLoop(ctx, track.rightWall);

  ctx.save();
  ctx.strokeStyle = "#d8d8d8";
  ctx.lineWidth = 0.28;
  ctx.setLineDash([2.4, 3.2]);
  strokeLoop(ctx, track.centerline);
  ctx.restore();

  drawStartLine(ctx, track);
}

export function drawCar(ctx, car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.heading);

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 2.15, 1.05, 0, 0, Math.PI * 2);
  ctx.fill();

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

  ctx.fillStyle = "#f4f4f4";
  ctx.fillRect(-2.25, -1.12, 0.34, 2.24);
  ctx.fillRect(1.55, -1.02, 0.26, 2.04);

  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.ellipse(0.15, 0, 0.62, 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
