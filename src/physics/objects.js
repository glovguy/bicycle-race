const physicsConstants = require('./constants');
const display = require('../display');

class Vector {
  constructor(x, y) {
    this.objectType = this.constructor.name;
    this.x = x;
    this.y = y;
  }
  xDirection() { return this.x / Math.abs(this.x); }
  yDirection() { return this.y / Math.abs(this.y); }
}
exports.Vector = Vector;

class PhysicalObject {
  constructor() {
    this.isAgent = false;
  }
  get draw() { return this.display.draw; }
}

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
  get draw() { return this.display.draw; }
}

class Erasure extends EphemeralObject {
  constructor(startX, startY) {
    super();
    this.objectType = this.constructor.name;
    this.pos = new Vector(startX, startY);
    this.vel = new Vector(0,0);
    this.display = {
      decay: 30 * physicsConstants.defaultTimeDelPerCycle
    };
  }
  get draw() { return display.drawBoom; }
}
exports.Erasure = Erasure;

class SolidObject extends PhysicalObject {
  constructor(startX, startY, color, size) {
    super();
    this.objectType = this.constructor.name;
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
      color: color
    };
  }
  get draw() { throw 'Not implemented'; }
};
exports.SolidObject = SolidObject;

class Actions {
  constructor() {
    this.jumping = false;
    this.walkingDirection = 0;
  }
}

class AgentObject extends SolidObject {
  constructor(startX, startY, color) {
    super(startX, startY, color, 35);
    this.objectType = this.constructor.name;
    this.walkingSpeed = 5300;
    this.walkingDirection = 0;
    this.killable = true;
    this.actions = new Actions();
    this.isAgent = true;
    this.reportCard = [];
  }
  get draw() { return display.drawBall; }

  onDeath() { this.reportCard.push('died'); }
  onKill() { this.reportCard.push('kill'); }
  onCollision() {
    this.kineticState.rattled = 17 * physicsConstants.defaultTimeDelPerCycle;
  }
}
exports.AgentObject = AgentObject;

class Debris extends SolidObject {
  constructor(x, y, velX=0, velY=0) {
    super(x, y, 'gray', 3);
    this.objectType = this.constructor.name;
    this.vel = new Vector(velX / physicsConstants.defaultTimeDelPerCycle, velY / physicsConstants.defaultTimeDelPerCycle);
    this.display.decay = 90 * physicsConstants.defaultTimeDelPerCycle;
  }
  get draw() { return display.drawDebris; }
}
exports.Debris = Debris;

exports.objectTypes = {};
for (typeName in exports) {
  if (typeName === 'objectTypes') { continue; }
  const type = exports[typeName];
  exports.objectTypes[typeName] = type;
}
