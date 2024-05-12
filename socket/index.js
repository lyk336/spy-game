const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const NodeCache = require('node-cache');

// If necessary, change the base URL and port to your actual URL and port
const websiteURL = 'http://localhost:3000';
const baseSocketServerURL = 'http://localhost';
const socketServerPort = 5000;
// ~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~!!~

const usersOnline = new Map();

const usersNotInGame = new Map();
const usersOnGameStart = new Map();

const locations = [];
fetch(`${websiteURL}/api/getLocations`)
  .then((resp) => resp.json())
  .then((resp) => {
    locations.push(...resp.locations);
  })
  .catch((err) => {
    throw new Error('cannot fetch locations' + err);
  });

const gameEndReason = {
  spyGuessedRightLocation: 'spyGuessedRightLocation',
  spyGuessedWrongLocation: 'spyGuessedWrongLocation',
  detectedSpy: 'detectedSpy',
  detectedWrongSpy: 'detectedWrongSpy',
};

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: websiteURL,
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
      if (usersRemain === 0) {
        game.isVotingForSpy = false;
        game.isGameEnded = true;
        cache.del('gameData');

        usersOnline.clear();
        mergeMaps();
        usersOnGameStart.clear();

        io.emit('updateOnlineUsers', mapToArray());
        io.emit('gameUpdated', game);
      }

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
    if (readyUsersNumber === usersNumber && usersOnline.size >= 4) {
      game();
      resetUsers();
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
      resetUsers();
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

        if (game.round === 3) {
          spyMustSelectLocation(game);
        }
        return;
      }

      const nextQuestionRoundUsers = mapToArray();
      const nextUser = nextQuestionRoundUsers[game.questionNumber];
      nextUser.isAsking = true;
      usersOnline.get(nextUser.id).isAsking = true;
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
        game.isRoundEnd = false;
        game.questionNumber = 0;
        game.round++;

        resetUsers();
        firstUserAsks();

        cache.set('gameData', JSON.stringify(game));
        io.emit('gameUpdated', game);
        io.emit('updateOnlineUsers', mapToArray());

        return;
      }

      // start voting for spy
      game.isRoundEnd = false;
      game.isVotingForSpy = true;
      resetUsers();
      usersOnline.forEach((user) => {
        user.canBeVoted = true;
      });

      cache.set('gameData', JSON.stringify(game));
      io.emit('gameUpdated', game);
      io.emit('updateOnlineUsers', mapToArray());
    }
  });

  socket.on('selectedSpy', (userData, selectedUserId) => {
    // check to avoid unexpected bugs
    const user = usersOnline.get(userData.id);
    if (!user) return;
    const cachedGame = cache.get('gameData');
    if (!cachedGame) return;
    const game = JSON.parse(cachedGame);
    if (!game.isVotingForSpy) return;
    if (user.id === selectedUserId) return;

    user.votedSpyId = selectedUserId;
    io.emit('updateOnlineUsers', mapToArray());

    const usersArray = mapToArray();
    const usersNumber = totalUsersInGame(usersArray);
    const votedUsers = usersArray.filter((user) => user.isInGame && user.isOnline && user.votedSpyId).length;
    if (votedUsers === usersNumber) {
      // calculate all votes
      const usersVoteNumbersEntries = usersArray.map((user) => [user.id, { ...user, numberOfVotes: 0 }]);
      const usersVoteNumbersMap = new Map(usersVoteNumbersEntries);

      usersArray.forEach((user) => {
        if (!user.votedSpyId) return;

        usersVoteNumbersMap.get(user.votedSpyId).numberOfVotes++;
      });
      const votedUsers = Array.from(usersVoteNumbersMap, ([key, value]) => value);
      const mostVotes = Math.max(...votedUsers.map((user) => user.numberOfVotes));
      const mostVotedUsers = votedUsers.filter((user) => user.numberOfVotes === mostVotes);

      resetUsers();
      io.emit('updateOnlineUsers', mapToArray());

      if (mostVotedUsers.length === 1) {
        const selectedUserId = mostVotedUsers[0].id;
        const selectedUser = usersOnline.get(selectedUserId);
        const isSpyDetected = selectedUser.isSpy;

        if (isSpyDetected) {
          if (!selectedUser.isOnline) {
            // spy left the game => lose
            const isSpyWon = false;
            endGame(isSpyWon, gameEndReason.detectedSpy);
            return;
          }

          // Spy gets a chance to guess the location
          spyMustSelectLocation(game);
          return;
        }

        // Spy instantly wins
        const isSpyWon = true;
        endGame(isSpyWon, gameEndReason.detectedWrongSpy);

        return;
      }

      // if 2 and more users get same number of votes
      mostVotedUsers.forEach((user) => {
        usersOnline.get(user.id).canBeVoted = true;
      });
      cache.set('gameData', JSON.stringify(game));
      io.emit('gameUpdated', game);
    }
  });

  socket.on('spyGuessedLocation', (locationName) => {
    // check to avoid unexpected bugs
    const cachedGame = cache.get('gameData');
    if (!cachedGame) return;
    const game = JSON.parse(cachedGame);
    if (!game.isRoundEnd && !game.isSpyMustGuessTheLocation) return;

    const isSpyWon = locationName === game.locationName;
    const reason = isSpyWon ? gameEndReason.spyGuessedRightLocation : gameEndReason.spyGuessedWrongLocation;
    endGame(isSpyWon, reason);
  });
});

server.listen(socketServerPort, () => {
  console.log(`Socket.IO server running on ${baseSocketServerURL}:${socketServerPort}`);
});

function addUserToMap(user, socket, map) {
  if (!map) map = usersOnline;

  const socketUser = { socketId: socket.id, ...user };
  map.set(user.id, socketUser);
}
function mapToArray() {
  const usersArray = Array.from(usersOnline, ([key, value]) => value).map((socketUser) => {
    return {
      id: socketUser.id,
      name: socketUser.name,
      isSpy: socketUser.isSpy,
      isReady: socketUser.isReady,
      isOnline: socketUser.isOnline,
      isInGame: socketUser.isInGame,
      isAsking: socketUser.isAsking,
      vote: socketUser.vote,
      votedSpyId: socketUser.votedSpyId,
      canBeVoted: socketUser.canBeVoted,
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
  const usersArray = mapToArray();
  const spyId = getRandomItem(usersArray).id;
  const location = getRandomItem(locations);
  const locationFileName = location.fileName;
  const locationName = location.locationName;
  const locationTheme = getRandomItem(location.relatedThemes);
  const usersIdInGame = usersArray.map((user) => user.id);

  for (const [key, value] of usersOnline.entries()) {
    usersOnGameStart.set(key, value);
  }
  shuffleMap();

  return {
    spyId,
    locationFileName,
    locationName,
    locationTheme,

    questionNumber: 0,
    isRoundEnd: false,
    round: 1,
    isVotingForSpy: false,
    isGameEnded: false,
    isSpyMustGuessTheLocation: false,
    usersIdInGame,
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

  isRecentlyCreatedGame = true;
  setTimeout(() => {
    isRecentlyCreatedGame = false;
  }, 10000);
}
function checkExistingGame(socketReceiver) {
  const cachedGame = cache.get('gameData');
  if (!cachedGame) return;

  const game = JSON.parse(cachedGame);
  if (socketReceiver) {
    io.to(socketReceiver).emit('gameUpdated', game);
  } else {
    io.emit('gameUpdated', game);
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
function endGame(isSpyWon, reason) {
  const cachedGame = cache.get('gameData');
  const game = JSON.parse(cachedGame);

  game.isVotingForSpy = false;
  game.isGameEnded = true;
  cache.del('gameData');

  usersOnline.forEach((user) => {
    if (!user.isOnline) {
      usersOnline.delete(user.id);
    }
  });
  mergeMaps();
  usersOnGameStart.clear();

  io.emit('updateOnlineUsers', mapToArray());
  io.emit('gameEnded', isSpyWon, game, reason);
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
function resetUsers() {
  usersOnline.forEach((user) => {
    user.isReady = false;
    user.isAsking = false;
    user.vote = null;
    user.votedSpyId = null;
    user.canBeVoted = false;
  });
}
function firstUserAsks() {
  const usersArray = mapToArray();
  const firstUser = usersArray[0];
  firstUser.isAsking = true;
  usersOnline.get(firstUser.id).isAsking = true;
}
function spyMustSelectLocation(game) {
  game.isVotingForSpy = false;
  game.isSpyMustGuessTheLocation = true;

  cache.set('gameData', JSON.stringify(game));
  io.emit('gameUpdated', game);
  io.emit('spyMustGuessTheLocation', game.spyId);
}
