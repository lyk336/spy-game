'use client';
import { useEffect, useRef, useState } from 'react';
import { User } from '@/scripts/user';
import { io, Socket } from 'socket.io-client';
import { GameResults, IGame } from '@/scripts/game';
// components
import Navbar from '@/components/nav';
import Players from '@/components/players';
import GameBar from '@/components/gameBar';
import Locations from '@/components/locations';
import Game from '@/components/gameScreen';

export default function Home() {
  const [onlineUsers, setOnlineUsers] = useState<Array<User>>([]);
  const [user, setUser] = useState<User>();
  const [game, setGame] = useState<IGame | null>(null);
  const [gameResult, setGameResult] = useState<null | GameResults>(null);
  const socketRef = useRef<Socket>();

  useEffect(() => {
    let userDataJSON: string | null = localStorage.getItem('userData');
    if (!userDataJSON) {
      const user: User = new User();
      const userJSON: string = JSON.stringify(user);
      userDataJSON = userJSON;

      localStorage.setItem('userData', userJSON);
    }
    const user: User = JSON.parse(userDataJSON);

    setUser(user);

    // connect socket.io
    const socket = io('http://26.60.238.204:5000');
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('userConnect', user);

      socket.on('gameCreated', (game: IGame, users: Array<User>) => {
        setGame(game);
        setOnlineUsers(users);
        setGameResult(null);

        const userData: User = { ...user };
        if (game.spyId !== user.id) {
          userData.isSpy = false;
        } else {
          userData.isSpy = true;
        }
        setUser(userData);
      });

      socket.on('updateOnlineUsers', (usersOnline: Array<User>) => {
        setOnlineUsers(usersOnline);
        try {
          const thisUserIndex: number = usersOnline.findIndex((userData: User) => userData.id === user.id);

          if (thisUserIndex < 0) {
            const thisUser: User = { ...user, isInGame: false };
            setUser(thisUser);
          } else {
            setUser(usersOnline[thisUserIndex]);
          }
        } catch (error) {}
      });

      socket.on('youNotInGame', (game: IGame) => {
        const userData: User = { ...user, isInGame: false };
        setUser(userData);
        setGame(game);
      });

      socket.on('gameUpdated', (game: IGame) => {
        setGame(game);
      });

      socket.on('gameEnded', (isSpyWon: boolean, game: IGame) => {
        setGame(game);

        if (isSpyWon) {
          if (user.id === game.spyId) {
            setGameResult(GameResults.win);
            return;
          }
          setGameResult(GameResults.lose);
          return;
        }

        if (user.id === game.spyId) {
          setGameResult(GameResults.lose);
          return;
        }
        setGameResult(GameResults.win);
      });
    });

    // user leave site => emit event
    const handleBeforeUnload = () => {
      socket.emit('userDisconnect', user);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socket.disconnect();
    };
  }, []);

  const handleChangeName = (name: string): void => {
    if (!user) return;

    const userData: User = { ...user, name };
    localStorage.setItem('userData', JSON.stringify({ ...userData, isSpy: false, isReady: false }));
    socketRef.current!.emit('userNameChanged', userData);
    setUser(userData);
  };

  const handleSelectSpy = (selectedUserId: string): void => {
    if (!user || selectedUserId === user.id) return;
    socketRef.current?.emit('selectedSpy', user, selectedUserId);
  };

  return (
    <main className='main'>
      <Navbar handleChangeName={handleChangeName} />
      {onlineUsers && (
        <>
          <div className='game-process '>
            <Players onlineUsers={onlineUsers} user={user} game={game} handleSelectSpy={handleSelectSpy} />
            <Game user={user} game={game} />
          </div>
          <GameBar
            game={game}
            socket={socketRef.current!}
            user={user}
            onlineUsers={onlineUsers}
            gameResult={gameResult}
          />
        </>
      )}
      <Locations />
    </main>
  );
}
