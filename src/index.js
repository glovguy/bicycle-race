const physics = require('./physics');
const utilities = require('./utilities');
const display = require('./display');
const brain = require('./brain');

window.blueScoreDisplay = document.querySelector('#blueScore');
window.goldScoreDisplay = document.querySelector('#goldScore');
const playPauseButton = document.querySelector('#playPause');

const mainCanvas = document.querySelector('#draw');
const ctx = mainCanvas.getContext('2d');

let playing = true;
let requestId;
let multiplayerMode;
let multiplayerHost = false;
let gameUuid;
window.score = { blue: 0, gold: 0 };
let keysPressed = {};
physics.setBoundsOfMap(mainCanvas.width, mainCanvas.height);

function actionInput(e) {
  if (e.keyCode == 32 && !keysPressed[32]) {
    keysPressed[32] = true;
    brain.localPlayerAgent.jump();
  }
  if (e.keyCode == 37) { brain.localPlayerAgent.actions.walkingDirection = -1; }
  if (e.keyCode == 39) { brain.localPlayerAgent.actions.walkingDirection = 1; }
}

function actionStop(e) {
  if (e.keyCode == 32) {
    keysPressed[32] = false;
    brain.localPlayerAgent.actions.jumping = false;
  }
  if (e.keyCode == 37 && brain.localPlayerAgent.actions.walkingDirection == -1) { brain.localPlayerAgent.actions.walkingDirection = 0; }
  if (e.keyCode == 39 && brain.localPlayerAgent.actions.walkingDirection == 1) { brain.localPlayerAgent.actions.walkingDirection = 0; }
}

function debrisFromUser($event) {
  physics.allObjects.push(physics.debrisAt($event.offsetX, $event.offsetY, 10*(Math.random()-0.5), 10*(Math.random()-0.5)));
}

function spawnAndEmitDebris($event) {
  debrisFromUser($event);
  socket.emit('Client payload', { debris: physics.allObjects[physics.allObjects.length-1] });
}

function resume() {
  cycleOfLife();
  playing = true;
  playPauseButton.innerHTML = 'Pause';
}

function pause() {
  stop();
  playPauseButton.innerHTML = 'Play';
}

function stop() {
  window.cancelAnimationFrame(requestId);
  requestId = undefined;
  playing = false;
}

function playpause() {
  playing ? pause() : resume();
}
window.playpause = playpause;

function snapMoment(subject, other) {
  return [
    subject.pos.x,
    subject.pos.y,
    subject.vel.x,
    subject.vel.y,
    other.pos.x,
    other.pos.y,
    other.vel.x,
    other.vel.y,
    subject.kineticState.freefall,
    other.pos.x - subject.pos.x,
    other.pos.y - subject.pos.y,
  ];
}

function snapMomentAsObject(subject, other) {
  return {
    selfPosX: subject.pos.x,
    selfPosY: subject.pos.y,
    selfVelX: subject.vel.x,
    selfVelY: subject.vel.y,
    otherPosX: other.pos.x,
    otherPosY: other.pos.y,
    otherVelX: other.vel.x,
    otherVelY: other.vel.y,
    selfFreefall: subject.kineticState.freefall,
    relativePosX: other.pos.x - subject.pos.x,
    relativePosY: other.pos.y - subject.pos.y,
    walkingDirection: subject.walkingDirection,
  };
}

function actionSnapshot(subject) {
  return {
    walkingDirection: subject.walkingDirection,
    jumping: subject.jumping
  };
}

let brainDebounceCycles = 12;
let currentCycle = 0;

function cycleOfLife() {
  if (!multiplayerMode && currentCycle == brainDebounceCycles) {
    currentCycle = 0;
    brain.botBrainCycle();
  }
  if (multiplayerMode) {
    const actionsToEmit = { walkingDirection: brain.localPlayerAgent.actions.walkingDirection };
    if (brain.localPlayerAgent.actions.jumping) { actionsToEmit['jumping'] = true; }
    socket.emit('Client payload', { actions: [brain.localPlayerAgent.actions] });
  }
  currentCycle += 1;

  const collisions = physics.findAllCollisions(physics.allObjects);
  physics.allObjects.forEach((obj) => {
    const agent = brain.agentResponsibleFor(obj);
    const actions = agent ? agent.actions : {};
    physics.physicsCycle(obj, collisions[Object.id(obj)], actions);
  });
  physics.enforceRigidBodies(physics.allObjects);
  brain.agents.forEach((agent) => {
    agent.actions.jumping = false;
  });
  physics.allObjects.forEach((obj) => {
    if (obj.display.decay !== undefined) { obj.display.decay -= 1 * physics.timeDel; }
  });
  physics.allObjects = physics.allObjects.filter((obj) => obj.display.decay == undefined || obj.display.decay > 0 );

  requestId = requestAnimFrame(cycleOfLife);
  if (multiplayerHost) { socket.emit('Host payload', { 'allObjects': physics.allObjects }); }
  display.drawWorld(ctx, physics.allObjects);
}

window.addEventListener('keydown', actionInput);
window.addEventListener('keyup', actionStop);

let socket;

function terminateGame() {
  if (socket) { socket.close(); }
  brain.agents = [];
  physics.allObjects = [];
  mainCanvas.removeEventListener('click', debrisFromUser);
  mainCanvas.removeEventListener('click', spawnAndEmitDebris);
  stop();
}

function startMultiplayerGame() {
  terminateGame();
  multiplayerMode = false;
  multiplayerHost = true;
  playPauseButton.disabled = true;
  brain.localPlayerAgent.body = physics.blueBody;
  brain.onlinePlayerAgent.body = physics.goldBody;
  brain.agents = [brain.localPlayerAgent, brain.onlinePlayerAgent];
  gameUuid = Math.floor(Math.random() * 8999) + 1000;
  window.history.pushState({}, "", gameUuid);
  socket = io.connect({
    query: 'gameUuid=' + gameUuid.toString(),
    resource: "socket.io"
  });
  socket.on('Client payload from server', function(payload) {
    if (payload['debris']) { physics.allObjects.push(payload['debris']); }
    if (payload['actions']) { brain.onlinePlayerAgent.actions = payload['actions'][0]; }
  });
  mainCanvas.addEventListener('click', debrisFromUser);
  playing = true;
  cycleOfLife();
  physics.spawnMultiplayerMatch();
  window.score = { blue: 0, gold: 0 };
  console.log('Started game at:', gameUuid);
}
window.startMultiplayerGame = startMultiplayerGame;

function joinMultiplayerGame() {
  terminateGame();
  multiplayerMode = true;
  multiplayerHost = false;
  playPauseButton.disabled = true;
  brain.localPlayerAgent.body = physics.goldBody;
  brain.onlinePlayerAgent.body = physics.blueBody;
  brain.agents = [brain.localPlayerAgent, brain.onlinePlayerAgent];
  physics.allObjects = [];
  socket = io.connect({
    query: 'gameUuid=' + gameUuid.toString(),
    resource: "socket.io"
  });
  socket.on('Host payload from server', function(payload) {
    physics.allObjects = payload['physics.allObjects'];
  });
  mainCanvas.addEventListener('click', spawnAndEmitDebris);
  playing = true;
  cycleOfLife();
  console.log('Joined multiplayer game at:', gameUuid);
}

function startGameAgainstBot() {
  terminateGame();
  multiplayerMode = false;
  playPauseButton.disabled = false;
  mainCanvas.addEventListener('click', debrisFromUser);
  playing = true;
  brain.localPlayerAgent.body = physics.blueBody;
  brain.sinusoidalAgent.body = physics.goldBody;
  brain.sinusoidalAgent.enemy = physics.blueBody;
  // neuralNetAgent.body = physics.goldBody;
  // neuralNetAgent.enemy = physics.blueBody;
  brain.agents = [brain.localPlayerAgent, brain.sinusoidalAgent];
  cycleOfLife();
  physics.spawnMultiplayerMatch();
  brain.agents.push(brain.sinusoidalAgent);
  window.score = { blue: 0, gold: 0 };
  console.log('Started game at:', gameUuid);
}

if (window.location.pathname !== '/') {
  gameUuid = parseInt(window.location.pathname.match(/([0-9]){4}/)[0]);
  joinMultiplayerGame();
} else {
  startGameAgainstBot();
}