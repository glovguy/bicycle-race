const blueWarriorLeft = document.querySelector('#blue-warrior-left');
const blueWarriorRight = document.querySelector('#blue-warrior-right');
const goldQueenLeft = document.querySelector('#gold-queen-left');
const goldQueenRight = document.querySelector('#gold-queen-right');

let protagonist;
let bot;
const blueBody = {
  pos: {
    x: 100,
    y: 75
  },
  vel: {
    x: 200,
    y: 200
  },
  size: 35,
  killable: true,
  collidable: true,
  walkingSpeed: 5300,
  walkingDirection: 0,
  kineticState: {
    freefall: true,
    jumping: false
  },
  display: {
    color: 'blue',
    leftImg: blueWarriorLeft,
    rightImg: blueWarriorRight,
    prevImg: blueWarriorRight
  }
};
const goldBody = {
  pos: {
    x: 1165,
    y: 75
  },
  vel: {
    x: 200,
    y: 200
  },
  size: 35,
  killable: true,
  collidable: true,
  walkingSpeed: 5300,
  walkingDirection: 0,
  kineticState: {
    freefall: true,
    jumping: false
  },
  display: {
    color: 'gold',
    leftImg: goldQueenLeft,
    rightImg: goldQueenRight,
    prevImg: goldQueenLeft
  }
};
let allObjects = [];
const gravity = 981 * 2.1;
let timeDel = 0.01;
const fadeOutFrames = 30;
const maxFreefallSpeed = 640;
const maxFlightClimbSpeed = 1350;
const maxHorizontalAirSpeed = 520;
const maxWalkingSpeed = 370;
const walkingResistance = 20;
const flyingResistance = 8;
const bumpCoefficient = 550;
const jumpAccel = 550 / timeDel;
let mapWidth;
let mapHeight;
const boomPathString = "M4.89 59.70L4.89 9.28L17.05 9.28L17.05 9.28Q22.71 9.28 26.44 12.16L26.44 12.16L26.44 12.16Q30.83 15.40 30.83 21.66L30.83 21.66L30.83 21.66Q30.83 29.71 22.68 33.15L22.68 33.15L22.68 33.15Q32.63 36.28 32.63 46.05L32.63 46.05L32.63 46.05Q32.63 52.42 28.09 56.29L28.09 56.29L28.09 56.29Q24.15 59.70 18.21 59.70L18.21 59.70L4.89 59.70ZM16.98 14.63L10.51 14.63L10.51 30.87L16.77 30.87L16.77 30.87Q19.72 30.87 21.62 29.50L21.62 29.50L21.62 29.50Q25.00 27.21 25.00 22.39L25.00 22.39L25.00 22.39Q25.00 14.63 16.98 14.63L16.98 14.63ZM16.98 35.89L10.51 35.89L10.51 54.35L17.30 54.35L17.30 54.35Q26.65 54.35 26.65 45.28L26.65 45.28L26.65 45.28Q26.65 35.89 16.98 35.89L16.98 35.89ZM54 7.84L54 7.84L54 7.84Q60.71 7.84 64.58 14.63L64.58 14.63L64.58 14.63Q68.70 21.83 68.70 34.49L68.70 34.49L68.70 34.49Q68.70 46.86 64.79 54L64.79 54L64.79 54Q60.93 61.14 54 61.14L54 61.14L54 61.14Q47.11 61.14 43.35 54.21L43.35 54.21L43.35 54.21Q39.30 46.83 39.30 34.42L39.30 34.42L39.30 34.42Q39.30 21.27 43.77 13.96L43.77 13.96L43.77 13.96Q47.53 7.84 54 7.84ZM54 13.11L54 13.11L54 13.11Q45.35 13.11 45.35 34.42L45.35 34.42L45.35 34.42Q45.35 55.86 54.07 55.86L54.07 55.86L54.07 55.86Q62.65 55.86 62.65 34.63L62.65 34.63L62.65 34.63Q62.65 13.11 54 13.11ZM90 7.84L90 7.84L90 7.84Q96.71 7.84 100.58 14.63L100.58 14.63L100.58 14.63Q104.70 21.83 104.70 34.49L104.70 34.49L104.70 34.49Q104.70 46.86 100.79 54L100.79 54L100.79 54Q96.93 61.14 90 61.14L90 61.14L90 61.14Q83.11 61.14 79.35 54.21L79.35 54.21L79.35 54.21Q75.30 46.83 75.30 34.42L75.30 34.42L75.30 34.42Q75.30 21.27 79.77 13.96L79.77 13.96L79.77 13.96Q83.53 7.84 90 7.84ZM90 13.11L90 13.11L90 13.11Q81.35 13.11 81.35 34.42L81.35 34.42L81.35 34.42Q81.35 55.86 90.07 55.86L90.07 55.86L90.07 55.86Q98.65 55.86 98.65 34.63L98.65 34.63L98.65 34.63Q98.65 13.11 90 13.11ZM111.45 59.70L111.45 9.28L118.62 9.28L125.96 50.66L133.31 9.28L140.52 9.28L140.52 59.70L135.63 59.70L135.63 20.57L128.64 59.70L123.33 59.70L116.61 20.57L116.61 59.70L111.45 59.70Z";

function setBoundsOfMap(width, height) {
  mapWidth = width;
  mapHeight = height;
}

function physicsCycle(obj, collision, actions) {
  if (!collision) { return; }

  // actions
  if (actions.walkingDirection !== undefined) { obj.vel.x += actions.walkingDirection * obj.walkingSpeed * timeDel; }
  if (actions.jumping) {
    obj.kineticState.freefall = true;
    obj.vel.y -= jumpAccel * timeDel;
  }

  // velocity
  if (obj.kineticState.freefall) { obj.vel.y += gravity * timeDel; }
  if (collision && collision['joust']['vel']) {
    obj.vel.x = collision['joust']['vel'].x;
    obj.vel.y = collision['joust']['vel'].y;
  }
  if (obj.vel.x !== 0) {
    const resistance = obj.kineticState.freefall ? flyingResistance : walkingResistance;
    if (obj.vel.x < resistance && obj.vel.x > -resistance) {
      obj.vel.x = 0;
    } else {
      const resistanceDirection = obj.vel.x / Math.abs(obj.vel.x);
      obj.vel.x -= resistanceDirection * resistance;
    }
  }

  if (obj.vel.y > maxFreefallSpeed && obj.kineticState.freefall) {
    const direction = obj.vel.y / Math.abs(obj.vel.y);
    obj.vel.y = maxFreefallSpeed * direction;
  }
  if (-obj.vel.y > maxFlightClimbSpeed && obj.kineticState.freefall) {
    const direction = obj.vel.y / Math.abs(obj.vel.y);
    obj.vel.y = maxFlightClimbSpeed * direction;
  }
  if (-obj.vel.y > bumpCoefficient && collision.topStick) {
    const direction = obj.vel.y / Math.abs(obj.vel.y);
    obj.vel.y = bumpCoefficient * direction;
  }
  if (Math.abs(obj.vel.x) > maxHorizontalAirSpeed && obj.kineticState.freefall) {
    const direction = obj.vel.x / Math.abs(obj.vel.x);
    obj.vel.x = maxHorizontalAirSpeed * direction;
  }
  if (Math.abs(obj.vel.x) > maxWalkingSpeed && !obj.kineticState.freefall) {
    const direction = obj.vel.x / Math.abs(obj.vel.x);
    obj.vel.x = maxWalkingSpeed * direction;
  }

  if (Math.abs(obj.vel.x) > bumpCoefficient && (collision.left || collision.right)) {
    obj.vel.x = -obj.vel.x;
  }
  if (Math.abs(obj.vel.x) < bumpCoefficient && collision.left) {
    obj.vel.x = Math.max(obj.vel.x, 0);
  }
  if (Math.abs(obj.vel.x) < bumpCoefficient && collision.right) {
    obj.vel.x = Math.min(obj.vel.x, 0); }

  if (collision.bottom && obj.vel.y > 0) {
    // console.log('collision bottom')
    obj.vel.y = 0;
    obj.kineticState.freefall = false;
  }

  // position
  obj.pos.y += obj.vel.y * timeDel;
  obj.pos.x += obj.vel.x * timeDel;
}

function enforceRigidBodies(allObjs) {

  allObjs.forEach(enforceRigidBodiesForObj);
}

function enforceRigidBodiesForObj(obj) {
  const collision = edgeCollisionsForObject(obj);
  if (!collision) { return; }
  if (collision.bottom) { obj.pos.y = mapHeight - obj.size; }
  if (obj.pos.y - obj.size < 0) {
    obj.pos.y = obj.size;
    if (-obj.vel.y > bumpCoefficient) {
      obj.kineticState.rattled = 17 * timeDel;
      obj.vel.y = -obj.vel.y;
    }
  }
  if (collision.right) { obj.pos.x = mapWidth - obj.size; }
  if (collision.left) { obj.pos.x = obj.size; }


  // const objCollisions = allObjects.filter((other) => {
  //   if (other == obj) { return false; }
  //   return objsAreIntersecting(obj, other);
  // });

  // if (objCollisions.length == 0) { return {}; }
  // objCollisions.forEach((other) => {
  //   const dispDirectionX = (obj.pos.x-other.pos.x) / Math.abs(obj.pos.x-other.pos.x);
  //   const dispDirectionY = (obj.pos.y-other.pos.y) / Math.abs(obj.pos.y-other.pos.y);

  //   obj.pos.x += ((obj.pos.x - other.pos.x) + obj.size) / 2.0;
  //   obj.pos.y += ((obj.pos.y - other.pos.y) + obj.size) / 2.0;
  // });
}

function findAllCollisions(allObjs) {
  let collisionsHash = {};
  allObjs.forEach((obj) => {
    collisionsHash[Object.id(obj)] = edgeCollisionsForObject(obj);
    collisionsHash[Object.id(obj)]['joust'] = joustsForObject(obj, allObjs);
  });
  return collisionsHash;
}

function edgeCollisionsForObject(obj) {
  const collision = {
    top: obj.pos.y - obj.size <= 0,
    bottom: obj.pos.y + obj.size >= mapHeight,
    left: obj.pos.x - obj.size < 0,
    right: obj.pos.x + obj.size >= mapWidth,
    topStick: obj.pos.y - obj.size == 0
  };
  if (collision['left']) { updateReportCard(obj, 'leftEdgeCollision'); }
  if (collision['right']) { updateReportCard(obj, 'rightEdgeCollision'); }
  if (collision['top']) { updateReportCard(obj, 'topEdgeCollision'); }
  if (collision['bottom']) { updateReportCard(obj, 'bottomEdgeCollision'); }
  return collision;
}

function objMurderedByObj(obj, other) {
  const deathAtX = obj.pos.x;
  const deathAtY = obj.pos.y;
  respawn(obj);
  score[other.display.color] += 1;
  allObjects.push(erasureAt(deathAtX, deathAtY));
  other.kineticState.rattled = 17*timeDel;
  allObjects.push(debrisAt(deathAtX+6, deathAtY+6, 10*Math.random(), 10*Math.random()));
  allObjects.push(debrisAt(deathAtX+6, deathAtY-6, 10*Math.random(), -10*Math.random()));
  allObjects.push(debrisAt(deathAtX-6, deathAtY+6, -10*Math.random(), 10*Math.random()));
  allObjects.push(debrisAt(deathAtX-6, deathAtY-6, -10*Math.random(), -10*Math.random()));
  updateReportCard(other, 'kill');
  updateReportCard(obj, 'died');
  blueScoreDisplay.innerHTML = score['blue'];
  goldScoreDisplay.innerHTML = score['gold'];
}

function objsAreIntersecting(obj, other) {
  const distBtObjs = Math.sqrt(
    (obj.pos.x - other.pos.x) * (obj.pos.x - other.pos.x) +
     (obj.pos.y - other.pos.y) * (obj.pos.y - other.pos.y)
   );
  return distBtObjs <= obj.size + other.size;
}

function joustsForObject(obj, allObjs) {
  const objCollisions = allObjs.filter((other) => {
    if (other == obj || !obj.collidable || !other.collidable) { return false; }
    return objsAreIntersecting(obj, other);
  });
  if (objCollisions.length == 0) { return {}; }

  const other = objCollisions[0];
  if (other['killable'] && obj['killable'] && other.pos.y > obj.pos.y) {
    objMurderedByObj(other, obj);
  } else if (obj['killable'] && other['killable'] && obj.pos.y > other.pos.y) {
    objMurderedByObj(obj, other);
  } else {
    obj.kineticState.rattled = 17 * timeDel;
    other.kineticState.rattled = 17 * timeDel;
    return {
      other: other,
      vel: {
        x: other.vel.x,
        y: other.vel.y
      }
    };
  }
  return {};
}

function respawn(obj) {
  obj.pos.y = 75;
  obj.pos.x = (obj.pos.x > mapWidth/2.0) ? 100 : mapWidth - 100;
  obj.kineticState.freefall = true;
}

function debrisAt(X, Y, velX=0, velY=0) {
  return {
    pos: {
      x: X,
      y: Y
    },
    vel: {
      x: velX / timeDel,
      y: velY / timeDel
    },
    size: 3,
    killable: false,
    collidable: true,
    kineticState: {
      freefall: true,
      jumping: false
    },
    display: {
      color: 'gray',
      decay: 90 * timeDel
    }
  };
}

function erasureAt(X, Y) {
  return {
    pos: {
      x: X,
      y: Y
    },
    vel: {
      x: 0,
      y: 0
    },
    size: 25,
    killable: false,
    collidable: false,
    kineticState: {
      freefall: false,
      jumping: false
    },
    display: {
      erase: true,
      decay: 30 * timeDel
    }
  };
}

function drawObject(obj) {
  if (obj.display.erase) {
    // ctx.globalCompositeOperation = "destination-out";
    // rc.circle(obj.pos.x, obj.pos.y, obj.size*4, {
    //   roughness: 8,
    //   stroke: "rgba(0,0,0,0)",
    //   fill: "rgba(0,0,0,1)",
    //   fillWeight: 8,
    //   hachureGap: 8
    // });
    // ctx.globalCompositeOperation = 'source-over';
    rc.path(moveSVGtoPoint(boomPathString, obj.pos.x-50, obj.pos.y-50), {
      roughness: 1.5,
      strokeWidth: 0.5,
      fill: 'yellow',
      fillStyle: 'solid'
    });
  } else {
    if (obj.display.decay > 0 && obj.display.decay <= fadeOutFrames * timeDel) {
      ctx.globalAlpha = obj.display.decay / (fadeOutFrames * timeDel);
    }
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
    ctx.globalAlpha = 1;
  }
}

function moveSVGtoPoint(svgStr, moveX, moveY) {
  const arr = svgStr.split(/([A-Z])/).splice(1);
  for (i=0; i < arr.length; i=i+2) {
    if (arr[i] === 'Z' || arr[i] === 'z') { continue; } // Z command has no coordinates associated
    let pointArr = arr[i+1].split(' ');
    for (p=0; p < pointArr.length; p=p+2) {
      pointArr[p] = String(moveX + parseFloat(pointArr[p]));
      pointArr[p+1] = String(moveY + parseFloat(pointArr[p+1]));
    }
    arr[i+1] = pointArr.join(' ');
  }
  const arrOut = arr.join('');
  return arrOut;
}

function spawnMultiplayerMatch() {
  protagonist = blueBody;
  bot = goldBody;

  blueBody['pos']['x'] = 100;
  blueBody['pos']['y'] = 75;
  blueBody['vel']['x'] = 200;
  blueBody['vel']['y'] = 200;
  blueBody.kineticState.freefall = true;

  goldBody['pos']['x'] = 1165;
  goldBody['pos']['y'] = 75;
  goldBody['vel']['x'] = -200;
  goldBody['vel']['y'] = 200;
  goldBody.kineticState.freefall = true;

  allObjects = [protagonist, bot];
}
