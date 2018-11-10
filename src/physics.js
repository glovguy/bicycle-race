const brain = require('./brain');

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  xDirection() { return this.x / Math.abs(this.x); }
  yDirection() { return this.y / Math.abs(this.y); }
}
exports.Vector = Vector;

class EphemeralObject {
  constructor() {
    this.size = 0;
    this.killable = false;
    this.colliable = false;
    this.kineticState = {
      freefall: false,
      jumping: false
    };
  }
}

class Erasure extends EphemeralObject {
  constructor(startX, startY) {
    super();
    this.pos = new Vector(startX, startY);
    this.vel = new Vector(0,0);
    this.display = {
      draw: 'boom',
      decay: 30 * exports.timeDel
    };
  }
}

class SolidObject {
  constructor(startX, startY, color, drawFunc, size) {
    this.size = size;
    this.pos = new Vector(startX, startY);
    this.vel = new Vector(0, 0);
    this.killable = false;
    this.collidable = true;
    this.kineticState = {
      freefall: true,
      jumping: false
    };
    this.display = {
      color: color,
      draw: drawFunc
    };
    this.enforceRigidBodiesForObj = enforceRigidBodiesForObj;
    this.edgeCollisionsForObject = edgeCollisionsForObject;
  }
};
exports.SolidObject = SolidObject;

class agentObject extends SolidObject {
  constructor(startX, startY, color) {
    super(startX, startY, color, 'ball', 35);
    this.walkingSpeed = 5300;
    this.walkingDirection = 0;
    this.killable = true;
  }
}

exports.blueBody = new agentObject(100, 75, 'blue');
exports.goldBody = new agentObject(1165, 75, 'gold');

class Debris extends SolidObject {
  constructor(x, y, velX=0, velY=0) {
    super(x, y, 'gray', 'debris', 3);
    this.vel = new Vector(velX / exports.timeDel, velY / exports.timeDel);
    this.display.decay = 90 * exports.timeDel;
  }
}
exports.Debris = Debris;

exports.allObjects = [];
const gravity = 981 * 2.1;
exports.timeDel = 0.01;
const maxFreefallSpeed = 640;
const maxFlightClimbSpeed = 1350;
exports.maxFlightClimbSpeed = maxFlightClimbSpeed;
const maxHorizontalAirSpeed = 520;
exports.maxHorizontalAirSpeed = maxHorizontalAirSpeed;
const maxWalkingSpeed = 370;
const walkingResistance = 20;
const flyingResistance = 8;
const bumpCoefficient = 550;
const jumpAccel = 550 / exports.timeDel;
let mapWidth;
let mapHeight;

// class physicsWorld {
//   constructor(width, height) {
//     this.mapWidth = width;
//     this.mapHeight = height;
//     this.allObjects = [];
//     this.gravity = 981 * 2.1;
//     this.timeDel = 0.01;
//     this.fadeOutFrames = 30;
//     this.maxFreefallSpeed = 640;
//     this.maxFlightClimbSpeed = 1350;
//     this.maxHorizontalAirSpeed = 520;
//     this.maxWalkingSpeed = 370;
//     this.walkingResistance = 20;
//     this.flyingResistance = 8;
//     this.bumpCoefficient = 550;
//     this.jumpAccel = 550 / this.timeDel;
//   }

//   physicsCycle(obj, collision, actions) {
//     if (!collision) { return; }

//     // actions
//     if (actions.walkingDirection !== undefined) { obj.vel.x += actions.walkingDirection * obj.walkingSpeed * timeDel; }
//     if (actions.jumping) {
//       obj.kineticState.freefall = true;
//       obj.vel.y -= this.jumpAccel * this.timeDel;
//     }

//     // velocity
//     if (obj.kineticState.freefall) { obj.vel.y += this.gravity * this.timeDel; }
//     if (collision && collision['joust']['vel']) {
//       obj.vel.x = collision['joust']['vel'].x;
//       obj.vel.y = collision['joust']['vel'].y;
//     }
//     if (obj.vel.x !== 0) {
//       const resistance = obj.kineticState.freefall ? this.flyingResistance : this.walkingResistance;
//       if (obj.vel.x < resistance && obj.vel.x > -resistance) {
//         obj.vel.x = 0;
//       } else {
//         const resistanceDirection = obj.vel.x / Math.abs(obj.vel.x);
//         obj.vel.x -= resistanceDirection * resistance;
//       }
//     }

//     if (obj.vel.y > this.maxFreefallSpeed && obj.kineticState.freefall) {
//       const direction = obj.vel.y / Math.abs(obj.vel.y);
//       obj.vel.y = this.maxFreefallSpeed * direction;
//     }
//     if (-obj.vel.y > this.maxFlightClimbSpeed && obj.kineticState.freefall) {
//       const direction = obj.vel.y / Math.abs(obj.vel.y);
//       obj.vel.y = this.maxFlightClimbSpeed * direction;
//     }
//     if (-obj.vel.y > this.bumpCoefficient && collision.topStick) {
//       const direction = obj.vel.y / Math.abs(obj.vel.y);
//       obj.vel.y = this.bumpCoefficient * direction;
//     }
//     if (Math.abs(obj.vel.x) > this.maxHorizontalAirSpeed && obj.kineticState.freefall) {
//       const direction = obj.vel.x / Math.abs(obj.vel.x);
//       obj.vel.x = this.maxHorizontalAirSpeed * direction;
//     }
//     if (Math.abs(obj.vel.x) > this.maxWalkingSpeed && !obj.kineticState.freefall) {
//       const direction = obj.vel.x / Math.abs(obj.vel.x);
//       obj.vel.x = this.maxWalkingSpeed * direction;
//     }

//     if (Math.abs(obj.vel.x) > this.bumpCoefficient && (collision.left || collision.right)) {
//       obj.vel.x = -obj.vel.x;
//     }
//     if (Math.abs(obj.vel.x) < this.bumpCoefficient && collision.left) {
//       obj.vel.x = Math.max(obj.vel.x, 0);
//     }
//     if (Math.abs(obj.vel.x) < this.bumpCoefficient && collision.right) {
//       obj.vel.x = Math.min(obj.vel.x, 0); }

//     if (collision.bottom && obj.vel.y > 0) {
//       obj.vel.y = 0;
//       obj.kineticState.freefall = false;
//     }

//     // position
//     obj.pos.y += obj.vel.y * this.timeDel;
//     obj.pos.x += obj.vel.x * this.timeDel;
//   };

//   enforceRigidBodies(allObjs) {
//     allObjs.forEach(enforceRigidBodiesForObj);
//   };

//   // findAllCollisions = findAllCollisions;
//   // objMurderedByObj = objMurderedByObj;
//   // private objsAreIntersecting = objsAreIntersecting;
//   // private joustsForObject = joustsForObject;
// }

function setBoundsOfMap(width, height) {
  mapWidth = width;
  mapHeight = height;
}
exports.setBoundsOfMap = setBoundsOfMap;

function physicsCycle(obj, collision, actions) {
  if (!collision) { return; }

  // actions
  if (actions.walkingDirection !== undefined) { obj.vel.x += actions.walkingDirection * obj.walkingSpeed * exports.timeDel; }
  if (actions.jumping) {
    obj.kineticState.freefall = true;
    obj.vel.y -= jumpAccel * exports.timeDel;
  }

  // velocity
  if (obj.kineticState.freefall) { obj.vel.y += gravity * exports.timeDel; }
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
  obj.pos.y += obj.vel.y * exports.timeDel;
  obj.pos.x += obj.vel.x * exports.timeDel;
}
exports.physicsCycle = physicsCycle;

function enforceRigidBodies(allObjs) {

  allObjs.forEach(enforceRigidBodiesForObj);
}
exports.enforceRigidBodies = enforceRigidBodies;

function enforceRigidBodiesForObj(obj) {
  const collision = edgeCollisionsForObject(obj);
  if (!collision) { return; }
  if (collision.bottom) { obj.pos.y = mapHeight - obj.size; }
  if (obj.pos.y - obj.size < 0) {
    obj.pos.y = obj.size;
    if (-obj.vel.y > bumpCoefficient) {
      obj.kineticState.rattled = 17 * exports.timeDel;
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
exports.findAllCollisions = findAllCollisions;

function edgeCollisionsForObject(obj) {
  const collision = {
    top: obj.pos.y - obj.size <= 0,
    bottom: obj.pos.y + obj.size >= mapHeight,
    left: obj.pos.x - obj.size <= 0,
    right: obj.pos.x + obj.size >= mapWidth,
    topStick: obj.pos.y - obj.size == 0
  };
  if (collision['left']) { brain.updateReportCard(obj, 'leftEdgeCollision'); }
  if (collision['right']) { brain.updateReportCard(obj, 'rightEdgeCollision'); }
  if (collision['top']) { brain.updateReportCard(obj, 'topEdgeCollision'); }
  if (collision['bottom']) { brain.updateReportCard(obj, 'bottomEdgeCollision'); }
  return collision;
}

function objMurderedByObj(obj, other) {
  const deathAtX = obj.pos.x;
  const deathAtY = obj.pos.y;
  respawn(obj);
  window.score[other.display.color] += 1;
  exports.allObjects.push(new Erasure(deathAtX, deathAtY));
  other.kineticState.rattled = 17*exports.timeDel;
  exports.allObjects.push(new Debris(deathAtX+6, deathAtY+6, 10*Math.random(), 10*Math.random()));
  exports.allObjects.push(new Debris(deathAtX+6, deathAtY-6, 10*Math.random(), -10*Math.random()));
  exports.allObjects.push(new Debris(deathAtX-6, deathAtY+6, -10*Math.random(), 10*Math.random()));
  exports.allObjects.push(new Debris(deathAtX-6, deathAtY-6, -10*Math.random(), -10*Math.random()));
  brain.updateReportCard(other, 'kill');
  brain.updateReportCard(obj, 'died');
  window.blueScoreDisplay.innerHTML = window.score['blue'];
  window.goldScoreDisplay.innerHTML = window.score['gold'];
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
    obj.kineticState.rattled = 17 * exports.timeDel;
    other.kineticState.rattled = 17 * exports.timeDel;
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
exports.respawn = respawn;

function spawnMultiplayerMatch() {
  exports.protagonist = exports.blueBody;
  // exports.protagonist = protagonist;
  exports.bot = exports.goldBody;
  // exports.bot = bot;

  exports.blueBody['pos']['x'] = 100;
  exports.blueBody['pos']['y'] = 75;
  exports.blueBody['vel']['x'] = 200;
  exports.blueBody['vel']['y'] = 200;
  exports.blueBody.kineticState.freefall = true;

  exports.goldBody['pos']['x'] = 1165;
  exports.goldBody['pos']['y'] = 75;
  exports.goldBody['vel']['x'] = -200;
  exports.goldBody['vel']['y'] = 200;
  exports.goldBody.kineticState.freefall = true;

  exports.allObjects = [exports.protagonist, exports.bot];
  // exports.allObjects = allObjects;
}
exports.spawnMultiplayerMatch = spawnMultiplayerMatch;
