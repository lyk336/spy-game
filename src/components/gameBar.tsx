import { IGame } from '@/scripts/game';
import { User, Votes } from '@/scripts/user';
import { FC, useMemo } from 'react';
import { Socket } from 'socket.io-client';

interface IGameBarProps {
  game: IGame | null;
  socket: Socket;
  endGame: () => void;
  user: User | undefined;
  onlineUsers: Array<User>;
}

const GameBar: FC<IGameBarProps> = ({ game, socket, endGame, user, onlineUsers }) => {
  const handleReady = (): void => {
    if (!user) return;
    socket.emit('userReady', user);
  };
  const handleNextRound = (): void => {
    if (!user) return;
    socket.emit('userNext', user);
  };

  const requiredNumberOfVotes = useMemo<number>((): number => {
    const suitableUsers: Array<User> = onlineUsers.filter((user: User) => user.isInGame && user.isOnline);
    return suitableUsers.length;
  }, [onlineUsers]);
  const numberOfVotes = useMemo<number>((): number => {
    const suitableUsers: Array<User> = onlineUsers.filter(
      (user: User) => user.isInGame && user.isOnline && user.isReady
    );
    return suitableUsers.length;
  }, [onlineUsers]);

  const handleVoteForNewRound = () => {
    socket.emit('userVote', user, Votes.nextRound);
  };
  const handleVoteForSpy = () => {
    socket.emit('userVote', user, Votes.detectSpy);
  };

  console.log(game);
  return (
    <div className='gamebar__container'>
      {game && !game.isGameEnded && game.isRoundEnd && (
        <h3 className='gamebar__votes title'>Total votes ({`${numberOfVotes}/${requiredNumberOfVotes}`})</h3>
      )}
      <div className='gamebar'>
        {onlineUsers.length > 0 && (!game || game.isGameEnded) && (
          <button className={`gamebar__start-game ${user?.isReady ? 'active-button' : ''}`} onClick={handleReady}>
            Ready to start game ({`${numberOfVotes}/${requiredNumberOfVotes}`})
          </button>
        )}

        {user?.isInGame && game && !game.isGameEnded && !game.isRoundEnd && (
          <button className={`gamebar__next-round ${user.isReady ? 'active-button' : ''}`} onClick={handleNextRound}>
            Next player ({`${numberOfVotes}/${requiredNumberOfVotes}`})
          </button>
        )}

        {user?.isInGame && game && !game.isGameEnded && game.isRoundEnd && (
          <>
            <button
              className={`gamebar__start-game ${user.vote === Votes.nextRound ? 'active-button' : ''}`}
              onClick={handleVoteForNewRound}
            >
              One more round
            </button>
            <button
              className={`gamebar__start-game ${user.vote === Votes.detectSpy ? 'active-button' : ''}`}
              onClick={handleVoteForSpy}
            >
              Vote for spy
            </button>
          </>
        )}
      </div>
    </div>
  );
};
export default GameBar;
