import NodeCache from 'node-cache';
import { NextResponse } from 'next/server';
import { Game } from '@/scripts/game';
import { User } from '@/scripts/user';

// const cachedGame = new NodeCache({ stdTTL: 60 });
// let isCreatingGame: boolean = false;

export async function POST(req: Request) {
  // if (isCreatingGame) {
  //   return;
  // }

  // const cachedGameData = cachedGame.get('gameData');
  // if (cachedGameData) {
  //   return NextResponse.json(cachedGameData);
  // }

  const users: Array<User> = await req.json();
  const game: Game = new Game(users);
  return NextResponse.json({ game });
}
