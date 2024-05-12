export interface IGame {
  spyId: string;
  locationFileName: string;
  locationName: string;
  locationTheme: string;

  // game progress
  questionNumber: number;
  isRoundEnd: boolean;
  round: number;
  isVotingForSpy: boolean;
  isGameEnded: boolean;
  isSpyMustGuessTheLocation: boolean;
  gameEndReason: null | GameEndReason;
}

export enum GameResults {
  win = 'win',
  lose = 'lose',
}
export enum GameEndReason {
  spyGuessedRightLocation = 'Spy guessed the location',
  spyGuessedWrongLocation = 'Spy did not guessed the location',
  detectedSpy = 'Spy has been detected',
  detectedWrongSpy = 'Wrong spy has been detected',
}
export type KeyOfGameEndReason = keyof typeof GameEndReason;
