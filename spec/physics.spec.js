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

    testWorld.allRigidObjects = ['foo'];
    testWorld.clear();

    expect(testWorld.length).toEqual(1);
    expect(testWorld.allObjects[0]).toEqual('foo');
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

describe('EulerCromer', () => {
  const noCollision = { 'joust': {}, 'edge': {} };
  const noAction = {};

  test('updates velocity with a linear walking resistance', () => {
    let obj = new physicsObjects.SolidObject(250, 250, 'red', 5);
    const world = new physics.World(1000, 1000, [obj]);
    obj.kineticState.freefall = false;
    world.walkingResistance = 0.2;
    obj.vel.x = 100;

    world.EulerCromer(obj, noCollision, noAction);
    expect(obj.vel.x).toEqual(80);

    world.EulerCromer(obj, noCollision, noAction);
    expect(obj.vel.x).toEqual(64);

    obj.vel.x = -100;
    world.EulerCromer(obj, noCollision, noAction);
    expect(obj.vel.x).toEqual(-80);
  });

  test('updates velocity from linear flying resistance', () => {
    let obj = new physicsObjects.SolidObject(250, 250, 'red', 5);
    const world = new physics.World(1000, 1000, [obj]);
    world.flyingResistance = 0.2;
    world.gravity = 0;
    obj.vel.x = -100;
    obj.vel.y = 100;

    world.EulerCromer(obj, noCollision, noAction);
    expect(obj.vel.x).toEqual(-80);
    expect(obj.vel.y).toEqual(80);

    world.EulerCromer(obj, noCollision, noAction);
    expect(obj.vel.x).toEqual(-64);
    expect(obj.vel.y).toEqual(64);
  });

  test('updates velocity from joust collisions', () => {
    let obj = new physicsObjects.SolidObject(250, 250, 'red', 5);
    const world = new physics.World(1000, 1000, [obj]);
    world.timeDel = 0.1;
    world.walkingResistance = 0;
    world.flyingResistance = 0;
    const collisionHash = { 'edge': {}, 'joust': { 'vel': { 'x': 42 } } };

    world.EulerCromer(obj, collisionHash, noAction);

    expect(obj.vel.x).toEqual(42);
  });

  test('updates velocity from gravity', () => {
    let obj = new physicsObjects.SolidObject(250, 250, 'red', 5);
    const world = new physics.World(1000, 1000, [obj]);
    world.flyingResistance = 0;
    world.timeDel = 0.1;
    world.gravity = 9;

    world.EulerCromer(obj, noCollision, noAction);

    expect(obj.vel.y).toEqual(0.9);
  });

  test('updates position', () => {
    let obj = new physicsObjects.SolidObject(250, 250, 'red', 5);
    const world = new physics.World(1000, 1000, [obj]);
    world.timeDel = 0.1;
    world.walkingResistance = 0;
    world.flyingResistance = 0;
    obj.vel.x = 3;

    world.EulerCromer(obj, noCollision, noAction);

    expect(obj.pos.x).toEqual(250.3);
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
        expect(collisions[Object.id(objRightColl)].edge.top).toBeFalsy();
        expect(collisions[Object.id(objRightColl)].edge.bottom).toBeFalsy();
        expect(collisions[Object.id(objRightColl)].edge.left).toBeFalsy();
        expect(collisions[Object.id(objRightColl)].edge.right).toBeTruthy();
        expect(collisions[Object.id(objRightColl)].edge.topStick).toBeFalsy();
      });

      it('detects a collision with the left edge of the map', () => {
        expect(collisions[Object.id(objLeftColl)].edge.top).toBeFalsy();
        expect(collisions[Object.id(objLeftColl)].edge.bottom).toBeFalsy();
        expect(collisions[Object.id(objLeftColl)].edge.left).toBeTruthy();
        expect(collisions[Object.id(objLeftColl)].edge.right).toBeFalsy();
        expect(collisions[Object.id(objLeftColl)].edge.topStick).toBeFalsy();
      });

      it('detects a collision with the bottom edge of the map', () => {
        expect(collisions[Object.id(objBottomColl)].edge.top).toBeFalsy();
        expect(collisions[Object.id(objBottomColl)].edge.bottom).toBeTruthy();
        expect(collisions[Object.id(objBottomColl)].edge.left).toBeFalsy();
        expect(collisions[Object.id(objBottomColl)].edge.right).toBeFalsy();
        expect(collisions[Object.id(objBottomColl)].edge.topStick).toBeFalsy();
      });

      it('detects a collision with the top edge of the map', () => {
        expect(collisions[Object.id(objTopColl)].edge.top).toBeTruthy();
        expect(collisions[Object.id(objTopColl)].edge.bottom).toBeFalsy();
        expect(collisions[Object.id(objTopColl)].edge.left).toBeFalsy();
        expect(collisions[Object.id(objTopColl)].edge.right).toBeFalsy();
        expect(collisions[Object.id(objTopColl)].edge.topStick).toBeFalsy();
      });

      it('detects a stick at the top edge of the map', () => {
        expect(collisions[Object.id(objSticked)].edge.top).toBeTruthy();
        expect(collisions[Object.id(objSticked)].edge.bottom).toBeFalsy();
        expect(collisions[Object.id(objSticked)].edge.left).toBeFalsy();
        expect(collisions[Object.id(objSticked)].edge.right).toBeFalsy();
        expect(collisions[Object.id(objSticked)].edge.topStick).toBeTruthy();
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
