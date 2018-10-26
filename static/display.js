const boomPathString = "M4.89 59.70L4.89 9.28L17.05 9.28L17.05 9.28Q22.71 9.28 26.44 12.16L26.44 12.16L26.44 12.16Q30.83 15.40 30.83 21.66L30.83 21.66L30.83 21.66Q30.83 29.71 22.68 33.15L22.68 33.15L22.68 33.15Q32.63 36.28 32.63 46.05L32.63 46.05L32.63 46.05Q32.63 52.42 28.09 56.29L28.09 56.29L28.09 56.29Q24.15 59.70 18.21 59.70L18.21 59.70L4.89 59.70ZM16.98 14.63L10.51 14.63L10.51 30.87L16.77 30.87L16.77 30.87Q19.72 30.87 21.62 29.50L21.62 29.50L21.62 29.50Q25.00 27.21 25.00 22.39L25.00 22.39L25.00 22.39Q25.00 14.63 16.98 14.63L16.98 14.63ZM16.98 35.89L10.51 35.89L10.51 54.35L17.30 54.35L17.30 54.35Q26.65 54.35 26.65 45.28L26.65 45.28L26.65 45.28Q26.65 35.89 16.98 35.89L16.98 35.89ZM54 7.84L54 7.84L54 7.84Q60.71 7.84 64.58 14.63L64.58 14.63L64.58 14.63Q68.70 21.83 68.70 34.49L68.70 34.49L68.70 34.49Q68.70 46.86 64.79 54L64.79 54L64.79 54Q60.93 61.14 54 61.14L54 61.14L54 61.14Q47.11 61.14 43.35 54.21L43.35 54.21L43.35 54.21Q39.30 46.83 39.30 34.42L39.30 34.42L39.30 34.42Q39.30 21.27 43.77 13.96L43.77 13.96L43.77 13.96Q47.53 7.84 54 7.84ZM54 13.11L54 13.11L54 13.11Q45.35 13.11 45.35 34.42L45.35 34.42L45.35 34.42Q45.35 55.86 54.07 55.86L54.07 55.86L54.07 55.86Q62.65 55.86 62.65 34.63L62.65 34.63L62.65 34.63Q62.65 13.11 54 13.11ZM90 7.84L90 7.84L90 7.84Q96.71 7.84 100.58 14.63L100.58 14.63L100.58 14.63Q104.70 21.83 104.70 34.49L104.70 34.49L104.70 34.49Q104.70 46.86 100.79 54L100.79 54L100.79 54Q96.93 61.14 90 61.14L90 61.14L90 61.14Q83.11 61.14 79.35 54.21L79.35 54.21L79.35 54.21Q75.30 46.83 75.30 34.42L75.30 34.42L75.30 34.42Q75.30 21.27 79.77 13.96L79.77 13.96L79.77 13.96Q83.53 7.84 90 7.84ZM90 13.11L90 13.11L90 13.11Q81.35 13.11 81.35 34.42L81.35 34.42L81.35 34.42Q81.35 55.86 90.07 55.86L90.07 55.86L90.07 55.86Q98.65 55.86 98.65 34.63L98.65 34.63L98.65 34.63Q98.65 13.11 90 13.11ZM111.45 59.70L111.45 9.28L118.62 9.28L125.96 50.66L133.31 9.28L140.52 9.28L140.52 59.70L135.63 59.70L135.63 20.57L128.64 59.70L123.33 59.70L116.61 20.57L116.61 59.70L111.45 59.70Z";

function drawWorld(canvas, allObjs) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'lightgrey';
  ctx.globalAlpha = 0.5;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
  allObjs.forEach(drawObject);
}

function drawObject(obj) {
  if (obj.display.decay > 0 && obj.display.decay <= fadeOutFrames * timeDel) {
    ctx.globalAlpha = obj.display.decay / (fadeOutFrames * timeDel);
  }
  const drawFn = drawFunctions[obj.display.draw];
  drawFn(obj);
  ctx.globalAlpha = 1;
}

function drawBoom(obj) {
  rc.path(moveSVGtoPoint(boomPathString, obj.pos.x-50, obj.pos.y-50), {
    roughness: 1.5,
    strokeWidth: 0.5,
    fill: 'yellow',
    fillStyle: 'solid'
  });
}

function drawBall(obj) {
  rc.circle(obj.pos.x, obj.pos.y, obj.size*2, {
    fill: obj.display.color,
    strokeWidth: 1,
    roughness: 0.8*Math.abs(obj.vel.x / maxHorizontalAirSpeed) + 1.8*Math.abs(obj.vel.y / maxFlightClimbSpeed) + 0.4
  });
  if (obj.kineticState.rattled > 0) {
    const ro = Math.random()*0.5;
    rc.arc(obj.pos.x, obj.pos.y, obj.size*2.45, obj.size*2.45, ro+Math.PI, ro+Math.PI * 1.15, false, {
      roughness: 2
    });
    rc.arc(obj.pos.x, obj.pos.y, obj.size*2.45, obj.size*2.45, ro+Math.PI * 1.7, ro+Math.PI * 1.85, false, {
      roughness: 2
    });
    rc.arc(obj.pos.x, obj.pos.y, obj.size*2.45, obj.size*2.45, ro+Math.PI * 2.5, ro+Math.PI * 2.65, false, {
      roughness: 2
    });
    obj.kineticState.rattled -= timeDel;
  }
}

function drawDebris(obj) {
  rc.circle(obj.pos.x, obj.pos.y, obj.size*2, {
    fill: 'grey',
    fillStyle: 'solid',
    stroke: "gray",
    roughness: 1.7
  });
}

function drawEraseMarks(obj) {
  ctx.globalCompositeOperation = "destination-out";
  rc.circle(obj.pos.x, obj.pos.y, obj.size*4, {
    roughness: 8,
    stroke: "rgba(0,0,0,0)",
    fill: "rgba(0,0,0,1)",
    fillWeight: 8,
    hachureGap: 8
  });
  ctx.globalCompositeOperation = 'source-over';
}

const drawFunctions = {
  'boom': drawBoom,
  'ball': drawBall,
  'erasure': drawEraseMarks,
  'debris': drawDebris
};
