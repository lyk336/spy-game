'use client';

import { useEffect, useRef, useState } from 'react';
import { User } from '@/scripts/user';
import Players from '@/components/players';
import Locations from '@/components/locations';
import { io } from 'socket.io-client';
import { Game } from '@/scripts/game';

export default function Home() {
  const [onlineUsers, setOnlineUsers] = useState<Array<User>>([]);
  const [user, setUser] = useState<User>();
  const [game, setGame] = useState<Game | null>(null);
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

      socket.on('gameCreated', (game: Game) => {
        setGame(game);

        let thisUser: User;
        if ((user.id = game.spyId)) {
          thisUser = { ...user, isSpy: true };
        } else {
          thisUser = { ...user, isSpy: false };
        }
        setUser(thisUser);

        // add spy role to actual spy
        setOnlineUsers((users: Array<User>) =>
          users.map((user: User) => {
            user.isSpy = false;
            return user;
          })
        );
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

  useEffect(() => {
    console.log(user);
  }, [user]);

  const handleCreateGame = () => {
    socketRef.current.emit('createGame');
  };
  return (
    <main className='main'>
      <button onClick={handleCreateGame}>CREAYE GAME</button>
      <Players game={game} onlineUsers={onlineUsers} user={user} />
      <Locations />
    </main>
  );
}
