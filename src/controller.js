import * as brain from './brain';

const spaceBarKey = 32;
const arrowLeftKey = 37;
const arrowRightKey = 39;

let keysPressed = {};

export function actionInput(e) {
  if (e.keyCode == spaceBarKey && !keysPressed[spaceBarKey]) {
    keysPressed[spaceBarKey] = true;
    brain.localPlayerAgent.jump();
  }
  if (e.keyCode == arrowLeftKey) { brain.localPlayerAgent.body.actions.walkingDirection = -1; }
  if (e.keyCode == arrowRightKey) { brain.localPlayerAgent.body.actions.walkingDirection = 1; }
}

export function actionStop(e) {
  if (e.keyCode == spaceBarKey) {
    keysPressed[spaceBarKey] = false;
    brain.localPlayerAgent.body.actions.jumping = false;
  }
  if (e.keyCode == arrowLeftKey && brain.localPlayerAgent.body.actions.walkingDirection == -1) { brain.localPlayerAgent.body.actions.walkingDirection = 0; }
  if (e.keyCode == arrowRightKey && brain.localPlayerAgent.body.actions.walkingDirection == 1) { brain.localPlayerAgent.body.actions.walkingDirection = 0; }
}
