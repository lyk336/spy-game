import { FC, useState } from 'react';
import Image from 'next/image';
import { locations, ILocation } from '@/scripts/locationsData';

interface ILocationsProps {}

const imageMap: Map<string, boolean> = new Map(locations.map((location: ILocation) => [location.locationName, false]));

const Locations: FC<ILocationsProps> = () => {
  const [crossedImages, setCrossedImages] = useState<Map<string, boolean>>(imageMap);

  const handleLocationClick = (locationName: string) => {
    crossedImages.set(locationName, !crossedImages.get(locationName));
    setCrossedImages((map: Map<string, boolean>) => new Map(map));
  };

  return (
    <div className='locations__container'>
      <section className='locations'>
        <h2 className='locations__title title'>Локації</h2>
        <ul className='locations__list'>
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
