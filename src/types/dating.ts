export type Gender = 'guy' | 'girl' | 'non-binary';
export type Seeking = 'guys' | 'girls' | 'everyone';

export type DatingIntent = 
  | 'down-for-whatever' 
  | 'speed-dating' 
  | 'hacker-bae' 
  | 'high-velocity';

export interface TelemetryData {
  attentionSpanCurve: number; // Late-game vs early-game point acceleration
  redFlagTolerance: number;   // Average graze distance to bombs in px
  impulseControl: number;      // Movement entropy / jitter smoothness
  dopamineHunger: number;      // Reaction latency to powerups in ms
}

export interface DaterProfile {
  id: string;
  handle: string;
  name: string;
  gender: Gender;
  seeking: Seeking;
  intent: DatingIntent;
  intentLabel: string;
  avatar: string;
  contactType: 'instagram' | 'telegram' | 'discord';
  contactValue: string;
  bio: string;
  lifetimeBenchmark: number; // Grounded baseline: 3 for guys, 2 for girls
  score: number;
  telemetry: TelemetryData;
  createdAt: number;
}

export interface MatchResult {
  matchedProfile: DaterProfile;
  scoreDelta: number;
  compatibilityPercent: number;
  attentionSync: number;
  toxicityResilience: number;
  impulseSync: number;
  icebreaker: string;
  matchedAt: number;
}
