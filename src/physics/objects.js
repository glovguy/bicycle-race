const physicsConstants = require('./constants');

class Vector {
  constructor(x, y) {
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
}

class Erasure extends EphemeralObject {
  constructor(startX, startY) {
    super();
    this.pos = new Vector(startX, startY);
    this.vel = new Vector(0,0);
    this.display = {
      draw: 'boom',
      decay: 30 * physicsConstants.defaultTimeDelPerCycle
    };
  }
}
exports.Erasure = Erasure;

class SolidObject extends PhysicalObject {
  constructor(startX, startY, color, drawFunc, size) {
    super();
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
  }
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
    super(startX, startY, color, 'ball', 35);
    this.walkingSpeed = 5300;
    this.walkingDirection = 0;
    this.killable = true;
    this.actions = new Actions();
    this.isAgent = true;
    this.reportCard = [];
  }
}
exports.AgentObject = AgentObject;

class Debris extends SolidObject {
  constructor(x, y, velX=0, velY=0) {
    super(x, y, 'gray', 'debris', 3);
    this.vel = new Vector(velX / physicsConstants.defaultTimeDelPerCycle, velY / physicsConstants.defaultTimeDelPerCycle);
    this.display.decay = 90 * physicsConstants.defaultTimeDelPerCycle;
  }
}
exports.Debris = Debris;
