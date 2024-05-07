import { getRandomItem } from './getRandomItem';
import { ILocation, locations } from './locationsData';
import { User } from './user';
export class Game {
  public spyId: string;
  private location: ILocation;
  public locationName: string;
  public locationTheme: string;

  constructor(currentPlayers: Array<User>) {
    this.spyId = getRandomItem<User>(currentPlayers).id;
    this.location = getRandomItem<ILocation>(locations);
    this.locationName = this.location.locationName;
    this.locationTheme = getRandomItem<string>(this.location.relatedThemes);
  }
}
