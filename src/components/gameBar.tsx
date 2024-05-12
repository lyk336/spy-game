import { GameEndReason, GameResults, IGame } from '@/scripts/game';
import { User, Votes } from '@/scripts/user';
import { FC, useMemo } from 'react';
import { Socket } from 'socket.io-client';

interface IGameBarProps {
  game: IGame | null;
  socket: Socket;
  user: User | undefined;
  onlineUsers: Array<User>;
  gameResult: GameResults | null;
  handleGuessLocation: () => void;
  isGuessingLocation: boolean;
  gameEndReason: GameEndReason | null;
  isSpyMustGuesLocationMessage: string | null;
}

const GameBar: FC<IGameBarProps> = ({
  game,
  socket,
  user,
  onlineUsers,
  gameResult,
  handleGuessLocation,
  isGuessingLocation,
  gameEndReason,
  isSpyMustGuesLocationMessage,
}) => {
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
  const numberOfUserVotedForSpy = useMemo<number>((): number => {
    const suitableUsers: Array<User> = onlineUsers.filter(
      (user: User) => user.isInGame && user.isOnline && user.votedSpyId
    );
    return suitableUsers.length;
  }, [onlineUsers]);

  const handleVoteForNewRound = () => {
    socket.emit('userVote', user, Votes.nextRound);
  };
  const handleVoteForSpy = () => {
    socket.emit('userVote', user, Votes.detectSpy);
  };

  return (
    <div className='gamebar__container'>
      <div className='gamebar'>
        <div className='gamebar__title-box'>
          {game && !game.isGameEnded && game.isRoundEnd && !game.isSpyMustGuessTheLocation && (
            <h3 className='gamebar__votes title'>Total votes ({`${numberOfVotes}/${requiredNumberOfVotes}`})</h3>
          )}
          {game?.isVotingForSpy && (
            <h3 className='gamebar__votes title'>{`Choose a person you think is a spy (${numberOfUserVotedForSpy}/${requiredNumberOfVotes})`}</h3>
          )}
          {isSpyMustGuesLocationMessage && (
            <h3 className='gamebar__spy-discovered title'>{isSpyMustGuesLocationMessage}</h3>
          )}
          {gameResult && (
            <>
              <h3 className={`gamebar__result title ${gameResult}`}>
                {gameResult === GameResults.win ? 'You win!' : 'You lose!'}
              </h3>
              <p className={`gamebar__reason ${gameResult}`}>{gameEndReason}</p>
            </>
          )}
        </div>

        <div className='gamebar__bar'>
          {onlineUsers.length > 0 && (!game || game.isGameEnded) && (
            <button className={`gamebar__start-game ${user?.isReady ? 'active-button' : ''}`} onClick={handleReady}>
              Ready to start game ({`${numberOfVotes}/${requiredNumberOfVotes}`})
            </button>
          )}

          {user?.isInGame &&
            game &&
            !game.isGameEnded &&
            !game.isRoundEnd &&
            !game.isVotingForSpy &&
            !game.isSpyMustGuessTheLocation && (
              <button
                className={`gamebar__next-round ${user.isReady ? 'active-button' : ''}`}
                onClick={handleNextRound}
              >
                Next player ({`${numberOfVotes}/${requiredNumberOfVotes}`})
              </button>
            )}

          {user?.isInGame && game && !game.isGameEnded && game.isRoundEnd && !game.isSpyMustGuessTheLocation && (
            <>
              <button
                className={`${user.vote === Votes.nextRound ? 'active-button' : ''}`}
                onClick={handleVoteForNewRound}
              >
                One more round
              </button>
              <button className={`${user.vote === Votes.detectSpy ? 'active-button' : ''}`} onClick={handleVoteForSpy}>
                Vote for spy
              </button>
              {user?.isSpy && (
                <button
                  className={`gamebar__guess-location ${isGuessingLocation ? 'guessing' : ''}`}
                  onClick={handleGuessLocation}
                >
                  Guess the location
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default GameBar;
