const physics = require('../src/physics/physics');
const physicsObjects = require('../src/physics/objects');
const collisionKinematics = require('../src/physics/collisionKinematics');
const utils = require('../src/utilities');


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

describe('World', () => {
  test('constructor', () => {
    const testWorld = new physics.World(10, 10, [new physicsObjects.SolidObject(0, 0, 'black', 'ball', 5)]);

    expect(testWorld.length).toEqual(1);
  });

  test('#push', () => {
    const testWorld = new physics.World(10, 10);
    testWorld.push(new physicsObjects.SolidObject(0, 0, 'black', 'ball', 5));

    expect(testWorld.length).toEqual(1);
  });

  test('#clear', () => {
    const testWorld = new physics.World(10, 10, [new physicsObjects.SolidObject(0, 0, 'black', 'ball', 5)]);

    testWorld.clear();

    expect(testWorld.length).toEqual(0);
  });
});

describe('Objects', () => {
  describe('SolidObject', () => {
    test('constructor', () => {
      const startX = 2;
      const startY = 5;
      const myColor = 'blue';
      const mySolidObj = new physicsObjects.SolidObject(startX, startY, myColor, 25);

      expect(mySolidObj.pos.x).toEqual(startX);
      expect(mySolidObj.pos.y).toEqual(startY);
      expect(mySolidObj.display.color).toEqual(myColor);
    });
  });

  describe('AgentObject', () => {
    test('constructor', () => {
      const startX = 22;
      const startY = 52;
      const myColor = 'yellow';
      const myAgentObj = new physicsObjects.AgentObject(startX, startY, myColor);

      expect(myAgentObj.pos.x = startX);
      expect(myAgentObj.pos.x = startY);
      expect(myAgentObj.display.color).toEqual(myColor);
      expect(myAgentObj.size).toEqual(35);
    });
  });
});

describe('collisionKinematics', () => {
  describe('#findAllCollisions', () => {
    const mapDims = [5000,5000];
    let obj1 = new physicsObjects.SolidObject(0, 0, 'black', 5);
    let obj2 = new physicsObjects.SolidObject(1, 1, 'blue', 5);
    let obj3 = new physicsObjects.SolidObject(250, 250, 'red', 5);
    let allObjs;

    describe('When two objects are overlapping', () => {
      beforeAll(() => {
        allObjs = [obj1, obj2, obj3];
      });

      it('detects a joust', () => {
        const collisions = collisionKinematics.findAllCollisions(allObjs, mapDims);

        expect(collisions[Object.id(obj1)]['joust']['other']).toBeTruthy();
        expect(collisions[Object.id(obj2)]['joust']['other']).toBeTruthy();
      });
    });


    describe('When an object is colliding with the edge of the map', () => {
      const objRightColl = new physicsObjects.SolidObject(mapDims[0]+1, 250, 'yellow', 5);
      const objLeftColl = new physicsObjects.SolidObject(-1, 250, 'yellow', 5);
      const objBottomColl = new physicsObjects.SolidObject(250, mapDims[1]+1, 'yellow', 5);
      const objTopColl = new physicsObjects.SolidObject(250, -1, 'yellow', 5);
      const objSticked = new physicsObjects.SolidObject(250, 5, 'yellow', 5);
      let collisions;

      beforeAll(() => {
        allObjs = [objRightColl, objLeftColl, objBottomColl, objTopColl, objSticked];
        collisions = collisionKinematics.findAllCollisions(allObjs, mapDims);
      });

      it('detects a collision with the right edge of the map', () => {
        expect(collisions[Object.id(objRightColl)].top).toBeFalsy();
        expect(collisions[Object.id(objRightColl)].bottom).toBeFalsy();
        expect(collisions[Object.id(objRightColl)].left).toBeFalsy();
        expect(collisions[Object.id(objRightColl)].right).toBeTruthy();
        expect(collisions[Object.id(objRightColl)].topStick).toBeFalsy();
      });

      it('detects a collision with the left edge of the map', () => {
        expect(collisions[Object.id(objLeftColl)].top).toBeFalsy();
        expect(collisions[Object.id(objLeftColl)].bottom).toBeFalsy();
        expect(collisions[Object.id(objLeftColl)].left).toBeTruthy();
        expect(collisions[Object.id(objLeftColl)].right).toBeFalsy();
        expect(collisions[Object.id(objLeftColl)].topStick).toBeFalsy();
      });

      it('detects a collision with the bottom edge of the map', () => {
        expect(collisions[Object.id(objBottomColl)].top).toBeFalsy();
        expect(collisions[Object.id(objBottomColl)].bottom).toBeTruthy();
        expect(collisions[Object.id(objBottomColl)].left).toBeFalsy();
        expect(collisions[Object.id(objBottomColl)].right).toBeFalsy();
        expect(collisions[Object.id(objBottomColl)].topStick).toBeFalsy();
      });

      it('detects a collision with the top edge of the map', () => {
        expect(collisions[Object.id(objTopColl)].top).toBeTruthy();
        expect(collisions[Object.id(objTopColl)].bottom).toBeFalsy();
        expect(collisions[Object.id(objTopColl)].left).toBeFalsy();
        expect(collisions[Object.id(objTopColl)].right).toBeFalsy();
        expect(collisions[Object.id(objTopColl)].topStick).toBeFalsy();
      });

      it('detects a stick at the top edge of the map', () => {
        expect(collisions[Object.id(objSticked)].top).toBeTruthy();
        expect(collisions[Object.id(objSticked)].bottom).toBeFalsy();
        expect(collisions[Object.id(objSticked)].left).toBeFalsy();
        expect(collisions[Object.id(objSticked)].right).toBeFalsy();
        expect(collisions[Object.id(objSticked)].topStick).toBeTruthy();
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
