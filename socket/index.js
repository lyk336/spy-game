const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const NodeCache = require('node-cache');

const baseLink = 'http://localhost';
// const baseLink = 'http://26.60.238.204';

const usersOnline = new Map();
// addUserToMap({ id: '1', name: 'vovan1', isSpy: false, isReady: true }, { id: '1' });
// addUserToMap({ id: '2', name: 'vovan2', isSpy: false, isReady: true }, { id: '2' });
// addUserToMap({ id: '3', name: 'vovan3', isSpy: false, isReady: true }, { id: '3' });
// const usersConnectedBeforeGameEnd = new Map();

const locations = [];
fetch(`${baseLink}:3000/api/getLocations`)
  .then((resp) => resp.json())
  .then((resp) => {
    locations.push(...resp.locations);
  })
  .catch((err) => {
    throw new Error('cannot fetch locations' + err);
  });

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: `${baseLink}:3000`,
    methods: ['GET', 'POST'],
  },
});

const cache = new NodeCache();
let isRecentlyCreatedGame = false;

io.on('connection', (socket) => {
  checkExistingGame(socket.id);

  socket.on('userConnect', (user) => {
    addUserToMap(user, socket);

    const usersArray = mapToArray();
    io.emit('updateOnlineUsers', usersArray);
  });

  socket.on('userDisconnect', (user) => {
    usersOnline.delete(user.id);

    const usersArray = mapToArray();
    io.emit('updateOnlineUsers', usersArray);
  });

  socket.on('userNameChanged', (userData) => {
    const user = usersOnline.get(userData.id);
    user.name = userData.name;
    const usersArray = mapToArray();
    io.emit('updateOnlineUsers', usersArray);
  });

  socket.on('userReady', (userData) => {
    if (isRecentlyCreatedGame) return;

    const user = usersOnline.get(userData.id);
    user.isReady = !user.isReady;
    const usersArray = mapToArray();
    io.emit('updateOnlineUsers', usersArray);

    // start game if all ready
    const readyUsersNumber = usersArray.filter((user) => user.isReady).length;
    const usersNumber = usersOnline.size;
    if (readyUsersNumber === usersNumber && usersOnline.size > 0) {
      game();
      usersOnline.forEach((user) => {
        user.isReady = false;
        console.log(user);
      });
      console.log(usersOnline);
      io.emit('updateOnlineUsers', mapToArray());
    }
    console.log(`${readyUsersNumber}/${usersNumber}`);
  });
});

server.listen(5000, () => {
  console.log(`Socket.IO server running on ${baseLink}:5000`);
});

function addUserToMap(user, socket) {
  const socketUser = { socketId: socket.id, ...user };
  usersOnline.set(user.id, socketUser);
}
function mapToArray() {
  const usersArray = Array.from(usersOnline, ([name, value]) => value).map((socketUser) => {
    return {
      id: socketUser.id,
      name: socketUser.name,
      isSpy: socketUser.isSpy,
      isReady: socketUser.isReady,
    };
  });

  return usersArray;
}
function createGame() {
  const getRandomItem = (array) => {
    const randomIndex = Math.floor(Math.random() * array.length);
    const randomItem = array[randomIndex];
    return randomItem;
  };
  const spyId = getRandomItem(mapToArray(usersOnline)).id;
  const location = getRandomItem(locations);
  const locationName = location.locationName;
  const locationTheme = getRandomItem(location.relatedThemes);

  return {
    spyId,
    locationName,
    locationTheme,
    isGameEnded: false,
  };
}
function game() {
  checkExistingGame();
  if (isRecentlyCreatedGame) return;

  const game = createGame();

  const spy = usersOnline.get(game.spyId);
  usersOnline.forEach((user) => {
    if (user === spy) {
      user.isSpy = true;
      return;
    }
    user.isSpy = false;
  });
  const usersArray = mapToArray();

  cache.set('gameData', JSON.stringify(game));
  // io.to(spy.socketId).emit('youSpy');
  io.emit('gameCreated', game, usersArray);

  isRecentlyCreatedGame = true;
  setTimeout(() => {
    isRecentlyCreatedGame = false;
  }, 10000);
}
function checkExistingGame(socketReceiver) {
  const cachedGame = cache.get('gameData');
  if (!cachedGame) return;

  const game = JSON.parse(cachedGame);
  const usersArray = mapToArray();
  if (socketReceiver) {
    console.log('RECONECTED AND RECEIVED');
    io.to(socketReceiver).emit('gameCreated', game, usersArray);
  } else {
    io.emit('gameCreated', game, usersArray);
  }
}
