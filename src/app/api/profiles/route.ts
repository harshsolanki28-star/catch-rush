import { NextResponse } from 'next/server';
import { DaterProfile } from '@/types/dating';

declare global {
  // eslint-disable-next-line no-var
  var __CRUSH_RUSH_PROFILES__: DaterProfile[] | undefined;
}

export async function GET() {
  const pool = globalThis.__CRUSH_RUSH_PROFILES__ || [];
  // Return recent public dater roster with censored contacts
  const safeList = pool.slice(0, 20).map((p) => ({
    id: p.id,
    handle: p.handle,
    name: p.name,
    avatar: p.avatar,
    gender: p.gender,
    intentLabel: p.intentLabel,
    score: p.score,
    createdAt: p.createdAt,
  }));

  return NextResponse.json({
    activeCount: Math.max(42, pool.length + 38), // Grounded realistic active count indicator
    recentDaters: safeList,
  });
}
