const physicsConstants = require('./constants');

exports.findAllCollisions = function(allObjects, mapDimensions) {
  let collisionsHash = {};
  allObjects.forEach((obj) => {
    collisionsHash[Object.id(obj)] = exports.edgeCollisionsForObject(obj, mapDimensions);
    collisionsHash[Object.id(obj)]['joust'] = exports.joustsForObject(obj, allObjects);
  });
  return collisionsHash;
}

exports.collisionsForObj = function(obj, allObjects, mapDimensions) {
  collisionsHash[Object.id(obj)] = exports.edgeCollisionsForObject(obj, mapDimensions);
  collisionsHash[Object.id(obj)]['joust'] = exports.joustsForObject(obj, allObjects);
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
  if (obj.isAgent) {
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
  if (objCollisions.length == 0) { return {}; }

  const other = objCollisions[0];
  if (other['killable'] && obj['killable'] && other.pos.y > obj.pos.y) {
    return {
      other: other,
      died: false
    }
  } else if (obj['killable'] && other['killable'] && obj.pos.y > other.pos.y) {
    return {
      other: other,
      died: true
    }
  } else {
    obj.kineticState.rattled = 17 * physicsConstants.defaultTimeDelPerCycle;
    other.kineticState.rattled = 17 * physicsConstants.defaultTimeDelPerCycle;
    return {
      other: other,
      vel: {
        x: other.vel.x,
        y: other.vel.y
      },
      died: false
    };
  }
  return {};
}

function _objsAreIntersecting(obj, other) {
  const distBtObjs = Math.sqrt(
    (obj.pos.x - other.pos.x) * (obj.pos.x - other.pos.x) +
     (obj.pos.y - other.pos.y) * (obj.pos.y - other.pos.y)
   );
  return distBtObjs <= obj.size + other.size;
}
