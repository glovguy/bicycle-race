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
    draw: drawBall
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
    draw: drawBall
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
      draw: drawDebris,
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
      draw: drawBoom,
      decay: 30 * timeDel
    }
  };
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
