const physicsConstants = require('./constants');

exports.findAllCollisions = function(allObjects, mapDimensions) {
  return allObjects.reduce((collHash, obj) => {
    return _collisionsForObj(collHash, obj, allObjects, mapDimensions);
  }, {});
}

const _collisionsForObj = function(collisionsHash, obj, allObjects, mapDimensions) {
  collisionsHash[Object.id(obj)] = {};
  collisionsHash[Object.id(obj)]['edge'] = exports.edgeCollisionsForObject(obj, mapDimensions);
  const { joust, edge } = exports.joustsForObject(obj, allObjects);
  collisionsHash[Object.id(obj)]['joust'] = joust;
  collisionsHash[Object.id(obj)]['edge'] = { ...collisionsHash[Object.id(obj)]['edge'], ...edge };
  return collisionsHash;
}

exports.edgeCollisionsForObject = function(obj, mapDimensions) {
  const mapWidth = mapDimensions[0];
  const mapHeight = mapDimensions[1];
  const collision = {
    top: obj.pos.y - obj.size <= 0,
    bottom: obj.pos.y + obj.size >= mapHeight,
    left: obj.pos.x - obj.size <= 0,
    right: obj.pos.x + obj.size >= mapWidth,
    topStick: obj.pos.y - obj.size == 0
  };
  if (obj.isAgent) {  // TODO: Move reportcard actions to AgentObject as callback
    if (collision['left']) { obj.reportCard.push('leftEdgeCollision'); }
    if (collision['right']) { obj.reportCard.push('rightEdgeCollision'); }
    if (collision['top']) { obj.reportCard.push('topEdgeCollision'); }
    if (collision['bottom']) { obj.reportCard.push('bottomEdgeCollision'); }
  }
  return collision;
}

exports.joustsForObject = function(obj, allObjs) {
  const objCollisions = allObjs.filter((other) => {
    if (other == obj || !obj.collidable || !other.collidable) { return false; }
    return _objsAreIntersecting(obj, other);
  });
  if (objCollisions.length == 0) { return { joust: {} }; }

  const other = objCollisions[0];
  if (other['killable'] && obj['killable'] && other.pos.y > obj.pos.y) {
    return { joust: {
      other: other,
      died: false
    } }
  }
  if (obj['killable'] && other['killable'] && obj.pos.y > other.pos.y) {
    return { joust: {
      other: other,
      died: true
    } }
  }
  if (obj['killable'] && obj.kineticState.freefall) { obj.kineticState.rattled = 17 * physicsConstants.defaultTimeDelPerCycle; }
  if (other['killable'] && other.kineticState.freefall) { other.kineticState.rattled = 17 * physicsConstants.defaultTimeDelPerCycle; }
  let vel;
  if (other['kineticState']['fixed']) {
    const xDist = Math.abs(obj.pos.x - other.pos.x);
    const yDist = Math.abs(obj.pos.y - other.pos.y);
    const horizontalCollision = xDist < yDist;
    const xDirection = horizontalCollision ? 1 : -1;
    const yDirection = horizontalCollision ? -1 : 1;
    vel = {
      x: xDirection * obj.vel.x,
      y: yDirection * obj.vel.y
    };
  } else if (obj['kineticState']['fixed']) {
    vel = { x:0, y:0 };
  } else {
    vel = {
      x: other.vel.x,
      y: other.vel.y
    };
  }
  let edge = {};
  let joust = {
    other: other,
    vel: vel,
    died: false,
  };
  const bottom = _walkableSphereRectCollision(obj, other);
  if (bottom) {
    edge['bottom'] = bottom;
    joust = {};
  }
  return { joust, edge };
}

function _walkableSphereRectCollision(obj1, obj2) {
  let sphere;
  let rect;
  if (obj1.collision == 'sphere') {
    sphere = obj1;
    rect = obj2;
  } else {
    sphere = obj2;
    rect = obj1;
  }
  const xDist = Math.abs(sphere.pos.x - rect.pos.x);
  const yDist = Math.abs(sphere.pos.y - rect.pos.y);
  const sphereAbove = rect.pos.y >= sphere.pos.y;
  return (yDist > xDist) && sphereAbove;
}

function _objsAreIntersecting(obj, other) {
  if (obj['collision'] == other['collision'] && other['collision'] == 'sphere') { return _twoSpheresIntersecting(obj, other); }
  return _sphereRectIntersecting(obj, other);
}

function _sphereRectIntersecting(obj1, obj2) {
  let sphere;
  let rect;
  if (obj1.collision == 'sphere') {
    sphere = obj1;
    rect = obj2;
  } else {
    sphere = obj2;
    rect = obj1;
  }

  const sphereToTheRight = rect.pos.x + rect.width/2.0 >= sphere.pos.x - sphere.size;
  const sphereToTheLeft = rect.pos.x - rect.width/2.0 <= sphere.pos.x + sphere.size;
  const sphereToTheTop = rect.pos.y + rect.height/2.0 >= sphere.pos.y - sphere.size;
  const sphereToTheBottom = rect.pos.y - rect.height/2.0 <= sphere.pos.y + sphere.size;

  return (sphereToTheRight && sphereToTheLeft) && (sphereToTheTop && sphereToTheBottom);
}

function _twoSpheresIntersecting(obj, other) {
  const distBtObjs = Math.sqrt(
    (obj.pos.x - other.pos.x) * (obj.pos.x - other.pos.x) +
     (obj.pos.y - other.pos.y) * (obj.pos.y - other.pos.y)
   );
  return distBtObjs <= obj.size + other.size;
}
