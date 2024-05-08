'use client';

import { useEffect, useRef, useState } from 'react';
import { User } from '@/scripts/user';
import Players from '@/components/players';
import Locations from '@/components/locations';
import { io } from 'socket.io-client';
import { IGame } from '@/scripts/game';
import Navbar from '@/components/nav';

export default function Home() {
  const [onlineUsers, setOnlineUsers] = useState<Array<User>>([]);
  const [user, setUser] = useState<User>();
  const [game, setGame] = useState<IGame | null>(null);
  const socketRef = useRef<any>();

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

  const handleCreateGame = () => {
    socketRef.current.emit('createGame');
  };
  const handleChangeName = (name: string): void => {
    if (!user) return;

    const userData: User = { ...user, name };
    localStorage.setItem('userData', JSON.stringify(userData));
    socketRef.current.emit('userNameChanged', userData);
    setUser(userData);
  };
  return (
    <main className='main'>
      <button onClick={handleCreateGame}>CREATE GAME</button>
      <Navbar handleChangeName={handleChangeName} />
      <Players onlineUsers={onlineUsers} user={user} />
      <Locations />
    </main>
  );
}
