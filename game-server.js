var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var url = require('url');
var port = process.env.PORT || 3000;
var physics = require('./src/physics/physics.js');


app.get('/(|[0-9]{4})', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/static/:fileName([A-Za-z_]+\.(js|jpg))', function(req, res){
  if (req.params.fileName == 'rough.js') {
    res.sendFile(__dirname + '/node_modules/roughjs/dist/rough.min.js');
  } else if (req.params.fileName == 'analytics.js') {
    res.sendFile(__dirname + '/static/analytics.js');
  } else if (req.params.fileName.includes('.js')) {
    res.sendFile(__dirname + '/dist/' + req.params.fileName);
  } else {
    res.sendFile(__dirname + '/static/' + req.params.fileName);
  }
});

http.listen(port, function() {
  console.log('listening on *:'+port);
});

io.on('connection', function(socket){
  var gameUuid = url.parse(socket.handshake.url, true).query.gameUuid;
  socket.join(gameUuid);
  console.log('user connected to room: ' + gameUuid);
  // physics.spawnMultiplayerMatch();
  // console.log(physics);

  socket.on('disconnect', function(){
    console.log('user disconnected from room: ' + gameUuid);
  });

  socket.on('Host payload', function(payload) {
    io.to(gameUuid).emit('Host payload from server', payload);
  });

  socket.on('Client payload', function(payload) {
    io.to(gameUuid).emit('Client payload from server', payload);
  });
});

// const TextToSVG = require('text-to-svg');
// const textToSVG = TextToSVG.loadSync();

// const attributes = {fill: 'red', stroke: 'black'};
// const options = {x: 0, y: 0, fontSize: 72, anchor: 'top', attributes: attributes};

// const svg = textToSVG.getSVG('BOOM', options);

// console.log(svg);

