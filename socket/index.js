const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const NodeCache = require('node-cache');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const usersOnline = new Map();
usersOnline.set('testId', { id: 'testId', name: 'test', isSpy: false });
const cachedGame = new NodeCache({ stdTTL: 10 });

io.on('connection', (socket) => {
  // if game already started
  const game = cachedGame.get('gameData');
  if (game) {
    io.emit('gameCreated', game);
  }

  socket.on('userConnect', (user) => {
    usersOnline.set(user.id, user);
    console.log('CONNECTED', usersOnline);

    const usersArray = mapToArray();
    io.emit('updateOnlineUsers', usersArray);
  });

  socket.on('userDisconnect', (user) => {
    usersOnline.delete(user.id);
    console.log('DISCONNECTED', usersOnline);

    const usersArray = mapToArray();
    io.emit('updateOnlineUsers', usersArray);
  });

  socket.on('createGame', () => {
    let game = cachedGame.get('gameData');
    if (game) {
      game = JSON.parse(game);
      io.emit('gameCreated', game);
      return;
    }

    const usersArray = mapToArray();
    const usersJSON = JSON.stringify(usersArray);

    const createGame = async () => {
      const fetchedData = await fetch('http://localhost:3000/api/start-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: usersJSON,
      });
      const gameData = await fetchedData.json();
      console.log(gameData.game);
      game = gameData.game;
      cachedGame.set('gameData', JSON.stringify(game));

      io.emit('gameCreated', game);
    };
    createGame();
  });
});

server.listen(5000, () => {
  console.log('Socket.IO server running on http://localhost:5000');
});

function mapToArray() {
  const usersArray = Array.from(usersOnline, ([name, value]) => value);
  return usersArray;
}
