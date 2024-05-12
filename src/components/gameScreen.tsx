import { IGame } from '@/scripts/game';
import { User } from '@/scripts/user';
import Image from 'next/image';
import { FC } from 'react';

interface IGameProps {
  user: User | undefined;
  game: IGame | null;
}

const Game: FC<IGameProps> = ({ user, game }) => {
  return (
    <div className='game'>
      <h2 className='game__title title'>{user?.isSpy ? 'Ви шпигун' : 'Локація'}</h2>
      <div className='game__location'>
        {game && user && (!user.isSpy || game.isGameEnded) && (
          <>
            <Image
              src={`/assets/locations/${game.locationFileName}`}
              alt={game.locationName}
              width={300}
              height={250}
            />
            <div className='game__info'>
              <span className='game__location-name bold-white-text'>{game.locationName}</span>
              <span className='game__location-theme'>{game.locationTheme}</span>
            </div>
          </>
        )}
        {game && !game.isGameEnded && user?.isSpy && (
          <>
            <Image src={`/assets/spy.webp`} alt={game.locationName} width={300} height={250} />
            <div className='game__info'>
              <span className='game__location-name bold-white-text'>Шпигун</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Game;
