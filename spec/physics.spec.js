const physics = require('../src/physics/physics');
const physicsObjects = require('../src/physics/objects');
const collisionKinematics = require('../src/physics/collisionKinematics');
console.log(physics);

describe('Vector', () => {
  let newVec;
  beforeAll(() => {
    newVec = new physicsObjects.Vector(2, -4);
  });

  test('x and y values', () => {
    expect(newVec.x).toBe(2);
    expect(newVec.y).toBe(-4);
  });

  test('xDirection', () => {
    expect(newVec.xDirection()).toBe(1);
  });

  test('yDirection', () => {
    expect(newVec.yDirection()).toBe(-1);
  });
});

describe('collisionKinematics', () => {
  describe('#findAllCollisions', () => {
    const mapDims = [5000,5000];
    let obj1 = new physicsObjects.SolidObject(0, 0, 'black', 'ball', 5);
    let obj2 = new physicsObjects.SolidObject(1, 1, 'blue', 'ball', 5);
    let obj3 = new physicsObjects.SolidObject(250, 250, 'red', 'ball', 5);
    let allObjs;
    describe('When two objects are overlapping', () => {
      beforeAll(() => {
        allObjs = [obj1, obj2, obj3];
      });

      it('detects a joust', () => {
        const collisions = collisionKinematics.findAllCollisions(allObjs, mapDims);
        expect(collisions).toBeTruthy();
        expect(collisions[Object.id(obj1)]['joust']['other']).toBeTruthy();
        expect(collisions[Object.id(obj2)]['joust']['other']).toBeTruthy();
      });
    });

    describe('When there are no overlapping objects', () => {
      beforeAll(() => {
        allObjs = [obj3];
      });
      it('returns an empty joust object', () => {
        const collisions = collisionKinematics.findAllCollisions(allObjs, mapDims);
        expect(collisions).toBeTruthy();
        expect(collisions[Object.id(obj3)]['joust']['other']).toBeFalsy();
      });
    });
  });
});
