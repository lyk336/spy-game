interface IUserData {
  id: string;
  name: string;
  isSpy: boolean;
}
export class User {
  public id: string = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  public name: string =
    'player' +
    Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
  public isSpy: boolean = false;

  // constructor(userData?: IUserData) {
  //   if (!userData) return;
  //   this.id = userData.id;
  //   this.name = userData.name;
  //   this.isSpy = userData.isSpy;
  // }
}
