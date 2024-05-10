'use client';
import { useEffect, useRef, useState } from 'react';
import { User } from '@/scripts/user';
import { io, Socket } from 'socket.io-client';
import { IGame } from '@/scripts/game';
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
  const socketRef = useRef<Socket>();

  useEffect(() => {
    let userData: string | null = localStorage.getItem('userData');
    if (!userData) {
      const user: User = new User();
      const userJSON: string = JSON.stringify(user);
      userData = userJSON;

      localStorage.setItem('userData', userJSON);
    }
    const user: User = JSON.parse(userData);

    setUser(user);

    // connect socket.io
    const socket = io('http://26.60.238.204:5000');
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('userConnect', user);

      socket.on('gameCreated', (game: IGame, users: Array<User>) => {
        setGame(game);
        setOnlineUsers(users);
        console.log('gameCreated', users);

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
        console.log('updateOnlineUsers', usersOnline);
        const thisUserIndex: number = usersOnline.findIndex((userData: User) => userData.id === user.id);

        if (thisUserIndex < 0) {
          const thisUser: User = { ...user, isInGame: false };
          setUser(thisUser);
        } else {
          setUser(usersOnline[thisUserIndex]);
        }
      });

      socket.on('youNotInGame', (game: IGame) => {
        const userData: User = { ...user, isInGame: false };
        setUser(userData);
        setGame(game);
      });

      socket.on('gameUpdated', (game: IGame) => {
        setGame(game);
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
    console.log('user', user);
    localStorage.setItem('userData', JSON.stringify({ ...userData, isSpy: false, isReady: false }));
    socketRef.current!.emit('userNameChanged', userData);
    setUser(userData);
  };
  const endGame = (): void => {
    if (!game) return;

    const endedGame: IGame = { ...game, isGameEnded: true };
    setGame(endedGame);
    socketRef.current?.emit('gameEnded');
  };

  return (
    <main className='main'>
      {/* <button onClick={handleCreateGame}>CREATE GAME</button> */}
      <Navbar handleChangeName={handleChangeName} />
      <div className='game-process '>
        <Players onlineUsers={onlineUsers} user={user} />
        <Game user={user} game={game} />
      </div>
      <GameBar game={game} socket={socketRef.current!} endGame={endGame} user={user} onlineUsers={onlineUsers} />
      <Locations />
    </main>
  );
}
