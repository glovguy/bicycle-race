const physicsObjects = require('./objects');
const physicsConstants = require('./constants');
const collisionKinematics = require('./collisionKinematics');

exports.allObjects = [];
const gravity = 981 * 2.1;
exports.timeDel = 1.0 * physicsConstants.defaultTimeDelPerCycle;
const maxFreefallSpeed = 640;
const maxFlightClimbSpeed = physicsConstants.defaultMaxFlightClimbSpeed;
const maxHorizontalAirSpeed = physicsConstants.defaultMaxHorizontalAirSpeed;
const maxWalkingSpeed = 370;
const walkingResistance = 20;
const flyingResistance = 8;
const bumpCoefficient = 550;
const jumpAccel = 550 / physicsConstants.defaultTimeDelPerCycle;
let mapWidth;
let mapHeight;

class World {
  constructor(width, height, objects=[]) {
    this.width = width;
    this.height = height;
    this.allObjects = objects;
  }

  push(obj) { return this.allObjects.push(obj); }
  clear() { this.allObjects = []; }
  get length() { return this.allObjects.length; }

  physicsCycle(callbacks) {
    const collisions = collisionKinematics.findAllCollisions(this.allObjects, [this.width, this.height]);
    this.allObjects.forEach((obj) => {
      if (collisions[Object.id(obj)]['joust']['died']) {
        const killer = collisions[Object.id(obj)]['joust']['other'];
        this.objMurderedByObj(obj, killer, callbacks);
      }
      const actions = obj.isAgent ? obj.actions : {};
      EulerCromer(obj, collisions[Object.id(obj)], actions);
    });
    enforceRigidBodies(this.allObjects);
    this.allObjects.forEach((obj) => {
      if (obj.display.decay !== undefined) { obj.display.decay -= 1 * physicsConstants.defaultTimeDelPerCycle; }
    });
    this.allObjects = this.allObjects.filter((obj) => obj.display.decay == undefined || obj.display.decay > 0 );
  }

  objMurderedByObj(obj, other, callbacks) {
    const deathAtX = obj.pos.x;
    const deathAtY = obj.pos.y;
    respawn(obj);
    this.allObjects.push(new physicsObjects.Erasure(deathAtX, deathAtY));
    callbacks.onCollision(other);
    // TODO: Move these four lines to AgentObject onDeath
    this.allObjects.push(new physicsObjects.Debris(deathAtX+6, deathAtY+6, 10*Math.random(), 10*Math.random()));
    this.allObjects.push(new physicsObjects.Debris(deathAtX+6, deathAtY-6, 10*Math.random(), -10*Math.random()));
    this.allObjects.push(new physicsObjects.Debris(deathAtX-6, deathAtY+6, -10*Math.random(), 10*Math.random()));
    this.allObjects.push(new physicsObjects.Debris(deathAtX-6, deathAtY-6, -10*Math.random(), -10*Math.random()));
    callbacks.onDeath(obj);
    callbacks.onKill(other);
    callbacks.incrementScoreForTeam(other.display.color);
  }
}
exports.World = World;

function setBoundsOfMap(width, height) {
  mapWidth = width;
  mapHeight = height;
}
exports.setBoundsOfMap = setBoundsOfMap;

function EulerCromer(obj, collision, actions) {
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
  if (-obj.vel.y > physicsConstants.defaultMaxFlightClimbSpeed && obj.kineticState.freefall) {
    const direction = obj.vel.y / Math.abs(obj.vel.y);
    obj.vel.y = physicsConstants.defaultMaxFlightClimbSpeed * direction;
  }
  if (-obj.vel.y > bumpCoefficient && collision.topStick) {
    const direction = obj.vel.y / Math.abs(obj.vel.y);
    obj.vel.y = bumpCoefficient * direction;
  }
  if (Math.abs(obj.vel.x) > physicsConstants.defaultMaxHorizontalAirSpeed && obj.kineticState.freefall) {
    const direction = obj.vel.x / Math.abs(obj.vel.x);
    obj.vel.x = physicsConstants.defaultMaxHorizontalAirSpeed * direction;
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

function enforceRigidBodies(allObjs) {
  allObjs.forEach(enforceRigidBodiesForObj);
}
exports.enforceRigidBodies = enforceRigidBodies;

function enforceRigidBodiesForObj(obj) {
  const collision = collisionKinematics.edgeCollisionsForObject(obj, [mapWidth,mapHeight]);
  if (!collision) { return; }
  if (collision.bottom) { obj.pos.y = mapHeight - obj.size; }
  if (obj.pos.y - obj.size < 0) {
    obj.pos.y = obj.size;
    if (-obj.vel.y > bumpCoefficient) {
      obj.kineticState.rattled = 17 * physicsConstants.defaultTimeDelPerCycle;
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

function respawn(obj) {
  obj.pos.y = 75;
  obj.pos.x = (obj.pos.x > mapWidth/2.0) ? 100 : mapWidth - 100;
  obj.kineticState.freefall = true;
}
