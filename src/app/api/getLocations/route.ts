import { NextResponse } from 'next/server';
import { locations } from '@/scripts/locationsData';

export async function GET() {
  return NextResponse.json({ locations });
}
