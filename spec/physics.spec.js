const physics = require('../static/physics');

describe('Vector', () => {
  let newVec;
  beforeAll(() => {
    newVec = new physics.Vector(2, -4);
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
