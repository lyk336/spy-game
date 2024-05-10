const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const NodeCache = require('node-cache');

const baseLink = 'http://localhost';
// const baseLink = 'http://26.60.238.204';

const usersOnline = new Map();
addUserToMap(
  {
    id: '1',
    name: 'vovan1',
    isSpy: false,
    isReady: true,
    isOnline: true,
    isInGame: true,
    isAsking: false,
    vote: null,
  },
  { id: '1' }
);
addUserToMap(
  {
    id: '2',
    name: 'vovan2',
    isSpy: false,
    isReady: true,
    isOnline: true,
    isInGame: true,
    isAsking: false,
    vote: null,
  },
  { id: '2' }
);
addUserToMap(
  {
    id: '3',
    name: 'vovan3',
    isSpy: false,
    isReady: true,
    isOnline: true,
    isInGame: true,
    isAsking: false,
    vote: null,
  },
  { id: '3' }
);
const usersNotInGame = new Map();
const usersOnGameStart = new Map();

const usersVotedForNewRound = [];
const usersVotedForDetectSpy = [];

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
  socket.on('userConnect', (user) => {
    userConnect(user, socket);
  });

  socket.on('userDisconnect', (user) => {
    if (!user) return;

    if (isGameInProgress()) {
      const disconnectedUser = usersOnline.get(user.id);
      disconnectedUser.isOnline = false;
      disconnectedUser.isReady = false;

      const usersArray = mapToArray();
      io.emit('updateOnlineUsers');

      const usersRemain = usersArray.filter((user) => user.isOnline).length;
      if (usersRemain === 0) endGame();

      return;
    }
    usersOnline.delete(user.id);

    const usersArray = mapToArray();
    io.emit('updateOnlineUsers', usersArray);
  });

  socket.on('userNameChanged', (userData) => {
    const user = usersOnline.get(userData.id);
    // case when user connected after the game started and want to change name
    if (!user) {
      const user = usersNotInGame.get(userData.id);
      if (user) user.name = userData.name;
      return;
    }
    user.name = userData.name;
    const usersArray = mapToArray();
    io.emit('updateOnlineUsers', usersArray);
  });

  socket.on('userReady', (userData) => {
    if (!userData) return;
    const cachedGame = cache.get('gameData');
    if (cachedGame) {
      const game = JSON.parse(cachedGame);
      if (!game.isGameEnded) return;
    }

    const user = usersOnline.get(userData.id);
    user.isReady = !user.isReady;
    const usersArray = mapToArray();

    // start game if all ready
    const readyUsersNumber = usersArray.filter((user) => user.isReady).length;
    const usersNumber = usersOnline.size;
    console.log(`${readyUsersNumber}/${usersNumber}`);
    if (readyUsersNumber === usersNumber && usersOnline.size > 0) {
      game();
      resetUsersVotes();
      firstUserAsks();
      io.emit('updateOnlineUsers', mapToArray());
      return;
    }

    io.emit('updateOnlineUsers', usersArray);
  });

  socket.on('userNext', (userData) => {
    // check to avoid unexpected bugs
    const user = usersOnline.get(userData.id);
    if (!user) return;
    const cachedGame = cache.get('gameData');
    if (!cachedGame) return;
    const game = JSON.parse(cachedGame);
    if (game.isRoundEnd || game.isGameEnded) return;

    user.isReady = !user.isReady;
    const usersArray = mapToArray();

    const readyUsersNumber = totalUsersInGame(usersArray);
    const usersNumber = readyUsersInGame(usersArray);
    if (readyUsersNumber === usersNumber) {
      console.log('usersOnline11', usersOnline);
      resetUsersVotes();
      game.questionNumber++;
      cache.set('gameData', JSON.stringify(game));

      const usersInGame = usersArray.filter((user) => user.isInGame).length;
      if (game.questionNumber >= usersInGame) {
        // round end
        game.questionNumber = -1;
        game.isRoundEnd = true;
        cache.set('gameData', JSON.stringify(game));
        io.emit('gameUpdated', game);
        io.emit('updateOnlineUsers', mapToArray());

        return;
      }

      const nextQuestionRoundUsers = mapToArray();
      const nextUser = nextQuestionRoundUsers[game.questionNumber];
      nextUser.isAsking = true;
      usersOnline.get(nextUser.id).isAsking = true;
      console.log('usersOnline.get(nextUser.id)', usersOnline.get(nextUser.id));
      io.emit('updateOnlineUsers', nextQuestionRoundUsers);
      return;
    }

    io.emit('updateOnlineUsers', usersArray);
  });

  socket.on('userVote', (userData, vote) => {
    // check to avoid unexpected bugs
    const user = usersOnline.get(userData.id);
    if (!user) return;
    const cachedGame = cache.get('gameData');
    if (!cachedGame) return;
    const game = JSON.parse(cachedGame);
    if (!game.isRoundEnd || game.isGameEnded) return;
    console.log('work', vote);

    if (user.vote === vote) {
      user.vote = null;
      user.isReady = false;
    } else {
      user.vote = vote;
      user.isReady = true;
    }
    io.emit('updateOnlineUsers', mapToArray());

    const usersArray = mapToArray();
    const usersNumber = totalUsersInGame(usersArray);
    const readyUsersNumber = readyUsersInGame(usersArray);

    const usersVotedForNewRound = usersArray.filter(
      (user) => user.isOnline && user.isInGame && user.vote === 'nextRound'
    ).length;
    const usersVotedForDetectSpy = usersArray.filter(
      (user) => user.isOnline && user.isInGame && user.vote === 'detectSpy'
    ).length;
    if (readyUsersNumber === usersNumber) {
      if (usersVotedForNewRound >= usersVotedForDetectSpy) {
        console.log('resul: new round');
        game.isRoundEnd = false;
        game.questionNumber = 0;

        resetUsersVotes();
        firstUserAsks();
        console.log('GAME RESUMED', game);

        cache.set('gameData', JSON.stringify(game));
        io.emit('gameUpdated', game);
        io.emit('updateOnlineUsers', mapToArray());

        return;
      }

      // start voting for spy
      console.log('resul: detect spy');
    }
  });

  socket.on('gameEnded', () => {
    endGame();
  });
});

server.listen(5000, () => {
  console.log(`Socket.IO server running on ${baseLink}:5000`);
});

function addUserToMap(user, socket, map) {
  if (!map) map = usersOnline;

  const socketUser = { socketId: socket.id, ...user };
  map.set(user.id, socketUser);
}
function mapToArray() {
  const usersArray = Array.from(usersOnline, ([name, value]) => value).map((socketUser) => {
    return {
      id: socketUser.id,
      name: socketUser.name,
      isSpy: socketUser.isSpy,
      isReady: socketUser.isReady,
      isOnline: socketUser.isOnline,
      isInGame: socketUser.isInGame,
      isAsking: socketUser.isAsking,
      vote: socketUser.vote,
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
  const locationFileName = location.fileName;
  const locationName = location.locationName;
  const locationTheme = getRandomItem(location.relatedThemes);
  const usersIdInGame = mapToArray().map((user) => user.id);

  for (const [key, value] of usersOnline.entries()) {
    usersOnGameStart.set(key, value);
  }
  shuffleMap();

  return {
    spyId: '1715351759252117',
    locationFileName,
    locationName,
    locationTheme,
    isGameEnded: false,
    usersIdInGame,
    questionNumber: 0,
    isRoundEnd: false,
    isVotingForSpy: true,
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

  cache.set('gameData', JSON.stringify(game));
  io.emit('gameCreated', game, mapToArray());
  console.log('GAME:', game);

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
    io.to(socketReceiver).emit('gameCreated', game, usersArray);
  } else {
    io.emit('gameCreated', game, usersArray);
  }
}
function userConnect(user, socket) {
  const cachedGame = cache.get('gameData');

  if (cachedGame) {
    const game = JSON.parse(cachedGame);

    if (game.usersIdInGame.includes(user.id)) {
      // user reconnected to game
      const cachedUser = usersOnGameStart.get(user.id);
      cachedUser.isOnline = true;
      usersOnline.set(cachedUser.id, cachedUser);

      io.emit('updateOnlineUsers', mapToArray());
      io.to(socket.id).emit('gameCreated', game, mapToArray());
      return;
    }

    // user connected but it wasn't a game member
    addUserToMap(user, socket, usersNotInGame);
    io.emit('youNotInGame', game);
    return;
  }

  addUserToMap(user, socket);
  io.emit('updateOnlineUsers', mapToArray());
}
function mergeMaps() {
  for (const [key, value] of usersNotInGame.entries()) {
    usersOnline.set(key, value);
  }
}
function endGame() {
  cache.del('gameData');
  mergeMaps();
  io.emit('updateOnlineUsers', mapToArray());
  usersOnGameStart.clear();
}
function isGameInProgress() {
  const cachedGame = cache.get('gameData');
  return cachedGame != null;
}
function shuffleMap() {
  const entriesArray = Array.from(usersOnline);

  for (let i = entriesArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entriesArray[i], entriesArray[j]] = [entriesArray[j], entriesArray[i]];
  }

  usersOnline.clear();
  entriesArray.forEach((entry) => {
    usersOnline.set(...entry);
  });
}
function totalUsersInGame(array) {
  const usersNumber = array.filter((user) => user.isOnline && user.isInGame).length;
  return usersNumber;
}
function readyUsersInGame(array) {
  const readyUsersNumber = array.filter((user) => user.isReady && user.isOnline && user.isInGame).length;
  return readyUsersNumber;
}
function resetUsersVotes() {
  usersOnline.forEach((user) => {
    user.isReady = false;
    user.isAsking = false;
    user.vote = null;
  });
}
function firstUserAsks() {
  const usersArray = mapToArray();
  const firstUser = usersArray[0];
  firstUser.isAsking = true;
  usersOnline.get(firstUser.id).isAsking = true;
}

// test;
setTimeout(() => {
  usersOnline.get('2').isOnline = false;
  io.emit('updateOnlineUsers', mapToArray());
  console.log('test disconnected');

  setTimeout(() => {
    usersOnline.get('2').isOnline = true;
    io.emit('updateOnlineUsers', mapToArray());
    console.log('test reconnected');
  }, 5000);
}, 10000);
setInterval(() => {
  usersOnline.get('1').isReady = true;
  usersOnline.get('2').isReady = true;
  usersOnline.get('3').isReady = true;
  io.emit('updateOnlineUsers', mapToArray());
}, 3000);
