export interface IGame {
  spyId: string;
  locationFileName: string;
  locationName: string;
  locationTheme: string;

  // game progress
  questionNumber: number;
  isRoundEnd: boolean;
  isVotingForSpy: boolean;
  isGameEnded: boolean;
}

export enum GameResults {
  win = 'win',
  lose = 'lose',
}
