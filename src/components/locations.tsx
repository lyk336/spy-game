import { FC, useState } from 'react';
import Image from 'next/image';
import { locations, ILocation } from '@/scripts/locationsData';
import { Socket } from 'socket.io-client';

interface ILocationsProps {
  isGuessingLocation: boolean;
  socket: Socket;
}

const imageMap: Map<string, boolean> = new Map(locations.map((location: ILocation) => [location.locationName, false]));

const Locations: FC<ILocationsProps> = ({ isGuessingLocation, socket }) => {
  const [crossedImages, setCrossedImages] = useState<Map<string, boolean>>(imageMap);

  const handleLocationClick = (locationName: string) => {
    if (isGuessingLocation) {
      if (crossedImages.get(locationName)) {
        setCrossedImages((prevImages: Map<string, boolean>) => {
          const updatedImages: Map<string, boolean> = new Map(prevImages);
          updatedImages.set(locationName, !updatedImages.get(locationName));
          return updatedImages;
        });
        return;
      }
      console.log('dsdsdsdsds');

      socket.emit('spyGuessedLocation', locationName);
      setCrossedImages(imageMap);
      return;
    }

    setCrossedImages((prevImages: Map<string, boolean>) => {
      const updatedImages: Map<string, boolean> = new Map(prevImages);
      updatedImages.set(locationName, !updatedImages.get(locationName));
      return updatedImages;
    });
  };

  return (
    <div className={'locations__container'}>
      <section className='locations'>
        <h2 className='locations__title title'>Локації</h2>
        <ul className={`locations__list ${isGuessingLocation ? 'guessing' : ''}`}>
          {locations.map((location: ILocation) => (
            <div
              className={`locations__location location ${crossedImages.get(location.locationName) ? 'crossed' : ''}`}
              onClick={() => {
                handleLocationClick(location.locationName);
              }}
              key={location.fileName}
            >
              <Image src={`/assets/locations/${location.fileName}`} alt='' width={152} height={120} />
              <h3 className='location__name bold-white-text'>{location.locationName}</h3>
            </div>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Locations;
