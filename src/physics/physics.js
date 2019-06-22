const physicsObjects = require('./objects');
const physicsConstants = require('./constants');
const collisionKinematics = require('./collisionKinematics');


class World {
  constructor(width, height, objects=[]) {
    this.width = width;
    this.height = height;
    this.allObjects = objects;

    this.gravity = 981 * 2.1;
    this.timeDel = 1.0 * physicsConstants.defaultTimeDelPerCycle;
    this.maxFreefallSpeed = 640;
    this.maxWalkingSpeed = 370;
    this.walkingResistance = 20;
    this.flyingResistance = 8;
    this.bumpCoefficient = 550;
    this.jumpAccel = 550 / physicsConstants.defaultTimeDelPerCycle;
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
      this.EulerCromer(obj, collisions[Object.id(obj)], actions);
    });
    this.enforceRigidBodies(this.allObjects); // Not the right way to do it, try adding back to Euler-Cromer
    this.allObjects.forEach((obj) => {
      if (obj.display.decay !== undefined) { obj.display.decay -= 1 * physicsConstants.defaultTimeDelPerCycle; }
    });
    this.allObjects = this.allObjects.filter((obj) => obj.display.decay == undefined || obj.display.decay > 0 );
  }

  objMurderedByObj(obj, other, callbacks) {
    const deathAtX = obj.pos.x;
    const deathAtY = obj.pos.y;
    this.respawn(obj);
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

  EulerCromer(obj, collision, actions) {
    if (!collision) { return; }

    // actions
    if (actions.walkingDirection !== undefined) { obj.vel.x += actions.walkingDirection * obj.walkingSpeed * this.timeDel; }
    if (actions.jumping) {
      obj.kineticState.freefall = true;
      obj.vel.y -= this.jumpAccel * this.timeDel;
    }

    // velocity
    if (obj.kineticState.freefall) { obj.vel.y += this.gravity * this.timeDel; }
    if (collision && collision['joust']['vel']) {
      obj.vel.x = collision['joust']['vel'].x;
      obj.vel.y = collision['joust']['vel'].y;
    }
    if (obj.vel.x !== 0) {
      const resistance = obj.kineticState.freefall ? this.flyingResistance : this.walkingResistance;
      if (obj.vel.x < resistance && obj.vel.x > -resistance) {
        obj.vel.x = 0;
      } else {
        const resistanceDirection = obj.vel.x / Math.abs(obj.vel.x);
        obj.vel.x -= resistanceDirection * resistance;
      }
    }

    if (obj.vel.y > this.maxFreefallSpeed && obj.kineticState.freefall) {
      const direction = obj.vel.y / Math.abs(obj.vel.y);
      obj.vel.y = this.maxFreefallSpeed * direction;
    }
    if (-obj.vel.y > physicsConstants.defaultMaxFlightClimbSpeed && obj.kineticState.freefall) {
      const direction = obj.vel.y / Math.abs(obj.vel.y);
      obj.vel.y = physicsConstants.defaultMaxFlightClimbSpeed * direction;
    }
    if (-obj.vel.y > this.bumpCoefficient && collision.topStick) {
      const direction = obj.vel.y / Math.abs(obj.vel.y);
      obj.vel.y = this.bumpCoefficient * direction;
    }
    if (Math.abs(obj.vel.x) > physicsConstants.defaultMaxHorizontalAirSpeed && obj.kineticState.freefall) {
      const direction = obj.vel.x / Math.abs(obj.vel.x);
      obj.vel.x = physicsConstants.defaultMaxHorizontalAirSpeed * direction;
    }
    if (Math.abs(obj.vel.x) > this.maxWalkingSpeed && !obj.kineticState.freefall) {
      const direction = obj.vel.x / Math.abs(obj.vel.x);
      obj.vel.x = this.maxWalkingSpeed * direction;
    }

    if (Math.abs(obj.vel.x) > this.bumpCoefficient && (collision.left || collision.right)) {
      obj.vel.x = -obj.vel.x;
    }
    if (Math.abs(obj.vel.x) < this.bumpCoefficient && collision.left) {
      obj.vel.x = Math.max(obj.vel.x, 0);
    }
    if (Math.abs(obj.vel.x) < this.bumpCoefficient && collision.right) {
      obj.vel.x = Math.min(obj.vel.x, 0); }

    if (collision.bottom && obj.vel.y > 0) {
      obj.vel.y = 0;
      obj.kineticState.freefall = false;
    }

    // position
    obj.pos.y += obj.vel.y * this.timeDel;
    obj.pos.x += obj.vel.x * this.timeDel;
  }

  enforceRigidBodies(allObjs) {
    allObjs.forEach((obj) => this.enforceRigidBodiesForObj(obj));
  }

  enforceRigidBodiesForObj(obj) {
    const collision = collisionKinematics.edgeCollisionsForObject(obj, [this.width,this.height]);
    if (!collision) { return; }
    if (collision.bottom) { obj.pos.y = this.height - obj.size; }
    if (obj.pos.y - obj.size < 0) {
      obj.pos.y = obj.size;
      if (-obj.vel.y > this.bumpCoefficient) {
        obj.kineticState.rattled = 17 * physicsConstants.defaultTimeDelPerCycle;
        obj.vel.y = -obj.vel.y;
      }
    }
    if (collision.right) { obj.pos.x = this.width - obj.size; }
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

  respawn(obj) {
    obj.pos.y = 75;
    obj.pos.x = (obj.pos.x > this.width/2.0) ? 100 : this.width - 100;
    obj.kineticState.freefall = true;
  }
}
exports.World = World;
