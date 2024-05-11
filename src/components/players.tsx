import { IGame } from '@/scripts/game';
import { User } from '@/scripts/user';
import { FC, useEffect, useState } from 'react';

interface IPlayersProps {
  onlineUsers: Array<User>;
  user: User | undefined;
  game: IGame | null;
  handleSelectSpy: (selectedUserId: string) => void;
}

const tableNumber: number = 10;

const Players: FC<IPlayersProps> = ({ onlineUsers, user, game, handleSelectSpy }) => {
  const [tables, setTables] = useState<Array<User | 0>>(Array(tableNumber).fill(0));

  useEffect(() => {
    if (onlineUsers.length > tableNumber) {
      setTables(onlineUsers.slice(0, tableNumber));
      return;
    }

    setTables([...onlineUsers, ...Array(tableNumber - onlineUsers.length).fill(0)]);
  }, [onlineUsers]);

  const isSelectableClass = (player: User | 0): string => {
    if (
      player === 0 ||
      !user ||
      !user.isInGame ||
      player.id === user.id ||
      !game ||
      game.isGameEnded ||
      !game.isVotingForSpy ||
      user.votedSpyId ||
      !player.canBeVoted
    ) {
      return '';
    }

    return 'select';
  };
  const isReadyClass = (player: User | 0): string => {
    if (player === 0 || !player.isReady || (game?.isVotingForSpy && !user?.votedSpyId)) return '';
    return 'ready';
  };

  return (
    <div className='players'>
      <h2 className='players__title title'>Гравці</h2>
      <ul className='players__tables tables'>
        {tables.map((player: User | 0, i: number) => {
          return (
            <div
              className={`tables__table ${isReadyClass(player)} ${i === onlineUsers.length - 1 ? 'last-user' : ''} ${
                player !== 0 && player.isAsking ? 'asking' : ''
              } ${isSelectableClass(player)} ${
                player !== 0 && game?.isVotingForSpy && user?.votedSpyId === player.id ? 'selected' : ''
              }`}
              onClick={() => {
                if (player === 0 || !game?.isVotingForSpy || !player.canBeVoted) return;
                handleSelectSpy(player.id);
              }}
              key={i}
            >
              {player !== 0 && (
                <div
                  className={`tables__player ${
                    user?.id === player.id && `player-you ${user?.isSpy ? 'player-spy' : ''}`
                  } ${!player.isOnline ? 'disconnected' : ''} ${player.isAsking ? 'asking' : ''}`}
                >
                  {player.name}
                </div>
              )}
            </div>
          );
        })}
      </ul>
    </div>
  );
};

export default Players;
