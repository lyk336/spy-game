import { Game } from '@/scripts/game';
import { User } from '@/scripts/user';
import { FC, useEffect, useState } from 'react';

interface IPlayersProps {
  onlineUsers: Array<User>;
  user: User | undefined;
  game: Game | null;
}

const tableNumber: number = 10;

const Players: FC<IPlayersProps> = ({ game, onlineUsers, user }) => {
  const [tables, setTables] = useState<Array<User | 0>>(Array(tableNumber).fill(0));
  // console.log(game, user);

  useEffect(() => {
    // const getUsers = async () => {
    //   const usersJSON: Response = await fetch('http://26.60.238.204:4000/users');
    //   const users: Array<User> = await usersJSON.json();

    // if (users.length > tableNumber) {
    //   setTables(users.slice(0, tableNumber));
    //   return;
    // }
    // setTables([...users, ...Array(tableNumber - users.length).fill(0)]);
    // };
    // getUsers();

    if (onlineUsers.length > tableNumber) {
      setTables(onlineUsers.slice(0, tableNumber));
      return;
    }

    setTables([...onlineUsers, ...Array(tableNumber - onlineUsers.length).fill(0)]);
  }, [onlineUsers]);

  return (
    <div className='players__container'>
      <div className='players'>
        <h2 className='players__title title'>Гравці</h2>
        <ul className='players__tables tables'>
          {tables.map((player: User | 0, i: number) => {
            return (
              <div className='tables__table' key={i}>
                <div
                  className={`tables__player ${
                    player !== 0 &&
                    user?.id === player.id &&
                    `player-you ${user?.isSpy && game?.spyId === user.id && 'player-spy'}`
                  }`}
                >
                  {player !== 0 && player.name}
                </div>
              </div>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Players;
