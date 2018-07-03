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
const allObjs = [protagonist, bot];
const gravity = 981 * 2.1;
const timeDel = 0.01;
const maxFreefallSpeed = 640;
const maxFlightClimbSpeed = 1350;
const maxHorizontalAirSpeed = 520;
const maxWalkingSpeed = 370;
const walkingResistance = 20;
const flyingResistance = 8;
const bumpCoefficient = 550;
const jumpAccel = 550 / timeDel;


function physicsCycle(obj, collisions) {
  const collision = {
    top: obj.pos.y - obj.size <= 0,
    bottom: obj.pos.y + obj.size > canvas.height,
    left: obj.pos.x - obj.size < 0,
    right: obj.pos.x + obj.size > canvas.width,
    topStick: obj.pos.y - obj.size == 0
  };

  // actions
  obj.vel.x += obj.walkingDirection * obj.walkingSpeed * timeDel;
  if (obj.kineticState.jumping) {
    obj.vel.y -= jumpAccel * timeDel;
    obj.kineticState.jumping = false;
  }

  // velocity
  if (obj.kineticState.freefall) { obj.vel.y += gravity * timeDel; }
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
    if (!collisionsHash[obj]) { collisionsHash[obj] = []; }
    collisionsHash[obj].push(edgeCollisionsForObject(obj));
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

function handleJousts(allObjs) {
  let others = allObjs.slice();
  allObjs.forEach((obj) => {
    others.splice(others.indexOf(obj), 1);
    handleJoustForObject(others, obj);
  });
}

function handleJoustForObject(allObjs, obj) {
  const collisions = allObjs.filter((other) => {
        if (other == obj) { return false; }
        const distBtObjs = Math.sqrt(
          (obj.pos.x - other.pos.x) * (obj.pos.x - other.pos.x) +
           (obj.pos.y - other.pos.y) * (obj.pos.y - other.pos.y)
         );
        if (distBtObjs <= obj.size + other.size) { return true; }
      });
  if (collisions.length == 0) { return; }

  const other = collisions[0];
  if (obj.pos.y < other.pos.y) {
    score[obj.display.color] += 1;
    other.pos.y = 75;
    other.kineticState.freefall = true;
    // if (obj.color == bot.color) { botBrainCycle(); }
  } else if (obj.pos.y > other.pos.y) {
    score[other.display.color] += 1;
    obj.pos.y = 75;
    obj.kineticState.freefall = true;
    // if (other.color == bot.color) { botBrainCycle(); }
  } else {
    const xswp = obj.vel.x;
    obj.vel.x = other.vel.x;
    other.vel.x = xswp;
    const yswp = obj.vel.y;
    obj.vel.y = other.vel.y;
    other.vel.y = yswp;
  }
  blueScoreDisplay.innerHTML = score['blue'];
  goldScoreDisplay.innerHTML = score['gold'];
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