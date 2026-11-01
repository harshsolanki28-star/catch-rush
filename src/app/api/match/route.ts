import { NextResponse } from 'next/server';
import { DaterProfile, MatchResult } from '@/types/dating';

// Global cache for warm Vercel serverless functions
declare global {
  // eslint-disable-next-line no-var
  var __CRUSH_RUSH_PROFILES__: DaterProfile[] | undefined;
}

const SEED_PROFILES: DaterProfile[] = [
  {
    id: 'seed-1',
    handle: '@maya_sol',
    name: 'Maya',
    gender: 'girl',
    seeking: 'guys',
    intent: 'down-for-whatever',
    intentLabel: 'Down for whatever tonight 🥂',
    avatar: '🫦',
    contactType: 'instagram',
    contactValue: 'maya.sol.ai',
    bio: 'Frontend dev & espresso martini enthusiast. Zero tolerance for slow texters.',
    lifetimeBenchmark: 2,
    score: 380,
    telemetry: {
      attentionSpanCurve: 1.15,
      redFlagTolerance: 24,
      impulseControl: 0.88,
      dopamineHunger: 220,
    },
    createdAt: Date.now() - 1000 * 60 * 12,
  },
  {
    id: 'seed-2',
    handle: '@alex_latency',
    name: 'Alex',
    gender: 'guy',
    seeking: 'girls',
    intent: 'hacker-bae',
    intentLabel: '10x Hacker Soulmate w/ benefits 💻',
    avatar: '🕶️',
    contactType: 'telegram',
    contactValue: 'alex_latency',
    bio: 'Rust & distributed systems. Need someone who can match my terminal velocity.',
    lifetimeBenchmark: 3,
    score: 430,
    telemetry: {
      attentionSpanCurve: 1.05,
      redFlagTolerance: 18,
      impulseControl: 0.92,
      dopamineHunger: 190,
    },
    createdAt: Date.now() - 1000 * 60 * 25,
  },
  {
    id: 'seed-3',
    handle: '@chloe_glitch',
    name: 'Chloe',
    gender: 'girl',
    seeking: 'everyone',
    intent: 'speed-dating',
    intentLabel: 'Short attention span speed date ⚡',
    avatar: '💅',
    contactType: 'instagram',
    contactValue: 'chloeglitch.exe',
    bio: 'ADHD visual artist. If we vibe in 45s, let us skip the awkward small talk.',
    lifetimeBenchmark: 2,
    score: 320,
    telemetry: {
      attentionSpanCurve: 0.85,
      redFlagTolerance: 30,
      impulseControl: 0.72,
      dopamineHunger: 150,
    },
    createdAt: Date.now() - 1000 * 60 * 45,
  },
  {
    id: 'seed-4',
    handle: '@liam_apex',
    name: 'Liam',
    gender: 'guy',
    seeking: 'girls',
    intent: 'high-velocity',
    intentLabel: 'Speedrunning tonight 📈',
    avatar: '😈',
    contactType: 'instagram',
    contactValue: 'liam_apex_fit',
    bio: 'Gym, hackathons, and high stakes. Catch me by the lounge after hours.',
    lifetimeBenchmark: 3,
    score: 490,
    telemetry: {
      attentionSpanCurve: 1.25,
      redFlagTolerance: 14,
      impulseControl: 0.85,
      dopamineHunger: 160,
    },
    createdAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: 'seed-5',
    handle: '@sasha_cyber',
    name: 'Sasha',
    gender: 'non-binary',
    seeking: 'everyone',
    intent: 'down-for-whatever',
    intentLabel: 'Down for whatever tonight 🥂',
    avatar: '🖤',
    contactType: 'discord',
    contactValue: 'sasha_cyber#4401',
    bio: 'Techno, cybersec, and bad decisions. Let us see if your reflexes hold up.',
    lifetimeBenchmark: 2.5,
    score: 360,
    telemetry: {
      attentionSpanCurve: 0.98,
      redFlagTolerance: 20,
      impulseControl: 0.81,
      dopamineHunger: 210,
    },
    createdAt: Date.now() - 1000 * 60 * 90,
  },
];

function getPool(): DaterProfile[] {
  if (!globalThis.__CRUSH_RUSH_PROFILES__) {
    globalThis.__CRUSH_RUSH_PROFILES__ = [...SEED_PROFILES];
  }
  return globalThis.__CRUSH_RUSH_PROFILES__;
}

export async function POST(req: Request) {
  try {
    const userProfile: DaterProfile = await req.json();
    const pool = getPool();

    // Filter by gender preference
    const candidates = pool.filter((p) => {
      if (p.id === userProfile.id) return false;
      const genderMatch =
        userProfile.seeking === 'everyone' ||
        (userProfile.seeking === 'guys' && p.gender === 'guy') ||
        (userProfile.seeking === 'girls' && p.gender === 'girl');

      const seekingMatch =
        p.seeking === 'everyone' ||
        (p.seeking === 'guys' && userProfile.gender === 'guy') ||
        (p.seeking === 'girls' && userProfile.gender === 'girl');

      return genderMatch && seekingMatch;
    });

    const activeList = candidates.length > 0 ? candidates : pool.filter((p) => p.id !== userProfile.id);

    // Find best match prioritizing score proximity (|ΔS| <= 100) and telemetry sync
    let bestMatch = activeList[0];
    let minDistance = Infinity;
    let computedDelta = 0;
    let computedComp = 85;
    let computedAttention = 90;
    let computedToxicity = 88;
    let computedImpulse = 85;

    for (const candidate of activeList) {
      const deltaS = Math.abs(userProfile.score - candidate.score);
      const deltaASC = Math.abs(userProfile.telemetry.attentionSpanCurve - candidate.telemetry.attentionSpanCurve);
      const deltaRFT = Math.abs(userProfile.telemetry.redFlagTolerance - candidate.telemetry.redFlagTolerance);
      const deltaICQ = Math.abs(userProfile.telemetry.impulseControl - candidate.telemetry.impulseControl);

      // Distance metric with high score weight
      const distance = deltaS + deltaASC * 50 + deltaRFT * 1.5 + deltaICQ * 40;

      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = candidate;
        computedDelta = deltaS;

        // Neuro-Audit metrics (percentage 0-100)
        computedAttention = Math.max(70, Math.min(99, Math.round(100 - deltaASC * 35 - (deltaS / 10))));
        computedToxicity = Math.max(68, Math.min(98, Math.round(100 - deltaRFT * 1.2)));
        computedImpulse = Math.max(72, Math.min(99, Math.round(100 - deltaICQ * 40)));
        computedComp = Math.round((computedAttention * 0.45) + (computedToxicity * 0.3) + (computedImpulse * 0.25));
      }
    }

    // Save user profile to live pool for subsequent players on this Vercel deployment
    pool.unshift(userProfile);
    if (pool.length > 100) {
      pool.pop();
    }

    // Dynamic spicy icebreaker based on telemetry
    const icebreakers = [
      `Our Catch Rush reflexes just synced at ${computedComp}% with identical dopamine curves! Drinks at the lounge? 🍸`,
      `We scored within ${computedDelta} points on Catch Rush. That means our attention spans are literally twins. What's your vibe tonight? ✨`,
      `Neuro-audit verified: ${computedAttention}% focus resonance and ${computedToxicity}% toxic ex resilience. Can't ignore this chemistry. 🥂`,
      `Our micro-reflexes matched on Catch Rush (${userProfile.score} vs ${bestMatch.score}). Clearly we need to celebrate. 🚀`,
    ];
    const icebreaker = icebreakers[Math.floor(Math.random() * icebreakers.length)];

    const result: MatchResult = {
      matchedProfile: bestMatch,
      scoreDelta: computedDelta,
      compatibilityPercent: computedComp,
      attentionSync: computedAttention,
      toxicityResilience: computedToxicity,
      impulseSync: computedImpulse,
      icebreaker,
      matchedAt: Date.now(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('Match error:', err);
    return NextResponse.json({ error: 'Failed to process match' }, { status: 500 });
  }
}
