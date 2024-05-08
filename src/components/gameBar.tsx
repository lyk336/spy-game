import { IGame } from '@/scripts/game';
import { User } from '@/scripts/user';
import { FC, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface IGameBarProps {
  game: IGame | null;
  socket: Socket;
  endGame: () => void;
  user: User | undefined;
  onlineUsers: Array<User>;
}

const GameBar: FC<IGameBarProps> = ({ game, socket, endGame, user, onlineUsers }) => {
  const [readyUsers, setReadyUsers] = useState<number>(0);

  useEffect(() => {
    const readyUsers: number = onlineUsers.filter((user: User) => user.isReady).length;
    setReadyUsers(readyUsers);
  }, [onlineUsers]);

  const handleReady = (): void => {
    if (!user) return;
    socket.emit('userReady', user);
  };
  const handleNextRound = (): void => {
    if (!user) return;
    socket.emit('userNext', user);
  };
  return (
    <div className='gamebar__container'>
      <div className='gamebar'>
        {(!game || game.isGameEnded) && (
          <button className='gamebar__start-game' onClick={handleReady}>
            Ready to start game ({`${readyUsers}/${onlineUsers.length}`})
          </button>
        )}

        {game && !game.isGameEnded && (
          <button className='gamebar__start-game' onClick={handleNextRound}>
            Next player ({`${readyUsers}/${onlineUsers.length}`})
          </button>
        )}
      </div>
    </div>
  );
};
export default GameBar;
