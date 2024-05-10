export enum Votes {
  nextRound = 'nextRound',
  detectSpy = 'detectSpy',
}

export class User {
  public id: string = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  public name: string =
    'player' +
    Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
  public isSpy: boolean = false;
  public isReady: boolean = false;
  public isOnline: boolean = true;
  public isInGame: boolean = true;
  public isAsking: boolean = false;
  // ----------------------------
  public vote: null | Votes = null;
}
