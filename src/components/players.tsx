import { User } from '@/scripts/user';
import { FC, useEffect, useState } from 'react';

interface IPlayersProps {
  onlineUsers: Array<User>;
  user: User | undefined;
}

const tableNumber: number = 10;

const Players: FC<IPlayersProps> = ({ onlineUsers, user }) => {
  const [tables, setTables] = useState<Array<User | 0>>(Array(tableNumber).fill(0));

  useEffect(() => {
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
                    player !== 0 && user?.id === player.id && `player-you ${user?.isSpy ? 'player-spy' : ''}`
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
