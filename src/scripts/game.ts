export interface IGame {
  spyId: string;
  locationFileName: string;
  locationName: string;
  locationTheme: string;
  isGameEnded: boolean;
  questionNumber: number;
  isRoundEnd: boolean;
  // --------------------
  isVotingForSpy: boolean;
}
