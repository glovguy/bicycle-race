const blueWarriorLeft = document.querySelector('#blue-warrior-left');
const blueWarriorRight = document.querySelector('#blue-warrior-right');
const goldQueenLeft = document.querySelector('#gold-queen-left');
const goldQueenRight = document.querySelector('#gold-queen-right');

const protagonist = {
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
const bot = {
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
let allObjs = [protagonist, bot];
const gravity = 981 * 2.1;
let timeDel = 0.01;
const maxFreefallSpeed = 640;
const maxFlightClimbSpeed = 1350;
const maxHorizontalAirSpeed = 520;
const maxWalkingSpeed = 370;
const walkingResistance = 20;
const flyingResistance = 8;
const bumpCoefficient = 550;
const jumpAccel = 550 / timeDel;


function physicsCycle(obj, collision) {
  if (!collision) {return;}

  // actions
  if (obj.walkingDirection !== undefined) { obj.vel.x += obj.walkingDirection * obj.walkingSpeed * timeDel; }
  if (obj.kineticState.jumping) {
    obj.vel.y -= jumpAccel * timeDel;
    obj.kineticState.jumping = false;
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
    obj.vel.y = 0;
    obj.kineticState.freefall = false;
  }

  // position
  // if (collision['joust'] && objsAreIntersecting(obj, collision['joust']['other'])) {
  //   const other = collision['joust']['other'];
  //   const dispDirectionX = (obj.pos.x-other.pos.x) / Math.abs(obj.pos.x-other.pos.x);
  //   const dispDirectionY = (obj.pos.y-other.pos.y) / Math.abs(obj.pos.y-other.pos.y);

  //   obj.pos.x += ((obj.pos.x - other.pos.x) + (dispDirectionX * obj.size) + (dispDirectionX * other.size)) / 2.0;
  //   obj.pos.y += ((obj.pos.y - other.pos.y) + (dispDirectionY * obj.size) + (dispDirectionX * other.size)) / 2.0;
  // }

  obj.pos.y += obj.vel.y * timeDel;
  obj.pos.x += obj.vel.x * timeDel;



  if (collision.bottom) { obj.pos.y = canvas.height - obj.size; }
  if (obj.pos.y - obj.size < 0) {
    obj.pos.y = obj.size;
    if (-obj.vel.y > bumpCoefficient) { obj.vel.y = -obj.vel.y; }
  }
  if (collision.right) { obj.pos.x = canvas.width - obj.size; }
  if (collision.left) { obj.pos.x = obj.size; }
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
  return {
    top: obj.pos.y - obj.size <= 0,
    bottom: obj.pos.y + obj.size > canvas.height,
    left: obj.pos.x - obj.size < 0,
    right: obj.pos.x + obj.size > canvas.width,
    topStick: obj.pos.y - obj.size == 0
  };
}

function objMurderedByObj(obj, other) {
  const deathAtX = obj.pos.x;
  const deathAtY = obj.pos.y;
  respawn(obj);
  score[other.display.color] += 1;
  spawnDebrisAt(deathAtX+6, deathAtY+6, 10*Math.random(), 10*Math.random());
  spawnDebrisAt(deathAtX+6, deathAtY-6, 10*Math.random(), -10*Math.random());
  spawnDebrisAt(deathAtX-6, deathAtY+6, -10*Math.random(), 10*Math.random());
  spawnDebrisAt(deathAtX-6, deathAtY-6, -10*Math.random(), -10*Math.random());
  rewardAgentsFor(other, 1.0);
  rewardAgentsFor(obj, 0);
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
    if (other == obj) { return false; }
    return objsAreIntersecting(obj, other);
  });
  if (objCollisions.length == 0) { return {}; }

  const other = objCollisions[0];
  if (other['killable'] && obj['killable'] && other.pos.y > obj.pos.y) {
    objMurderedByObj(other, obj);
  } else if (obj['killable'] && other['killable'] && obj.pos.y > other.pos.y) {
    objMurderedByObj(obj, other);
  } else {
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
  obj.pos.x = (obj.pos.x > canvas.width/2.0) ? 100 : canvas.width - 100;
  obj.kineticState.freefall = true;
}

function spawnDebrisAt(X, Y, velX=0, velY=0) {
  const debris = {
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
    kineticState: {
      freefall: true,
      jumping: false
    },
    display: {
      color: 'gray',
      decay: 90 * timeDel
    }
  };
  allObjs.push(debris);
}

function drawObject(obj) {
  ctx.fillStyle = obj.display.color;
  ctx.beginPath();
  ctx.arc(obj.pos.x, obj.pos.y, obj.size,0,2*Math.PI);
  ctx.fill();
  // if (obj.vel.x < 0) {
  //   ctx.drawImage(obj.display.leftImg, obj.pos.x-obj.size, obj.pos.y-obj.size, obj.size*2, obj.size*2);
  //   obj.display.prevImg = obj.display.leftImg;
  // } else if (obj.vel.x > 0) {
  //   ctx.drawImage(obj.display.rightImg, obj.pos.x-obj.size, obj.pos.y-obj.size, obj.size*2, obj.size*2);
  //   obj.display.prevImg = obj.display.rightImg;
  // } else {
  //   ctx.drawImage(obj.display.prevImg, obj.pos.x-obj.size, obj.pos.y-obj.size, obj.size*2, obj.size*2);
  // }
}
