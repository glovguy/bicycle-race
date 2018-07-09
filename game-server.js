var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var url = require('url');


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/:gameUuid([0-9]{4})', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/brain.js', function(req, res){
  res.sendFile(__dirname + '/brain.js');
});
app.get('/utilities.js', function(req, res){
  res.sendFile(__dirname + '/utilities.js');
});
app.get('/physics.js', function(req, res){
  res.sendFile(__dirname + '/physics.js');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket){
  var gameUuid = url.parse(socket.handshake.url, true).query.gameUuid;
  socket.join(gameUuid);
  console.log('user connected to room: ' + gameUuid);

  socket.on('disconnect', function(){
    console.log('user disconnected from room: ' + gameUuid);
  });

  socket.on('Host payload', function(payload) {
    io.to(gameUuid).emit('allObjs from server', payload['allObjs']);
  });

  socket.on('Client payload', function(payload) {
    io.to(gameUuid).emit('Client actions from server', payload);
  });
});
