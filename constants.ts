
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 768;

export const PLAYER_RADIUS = 12;
export const PLAYER_SPEED = 6;
export const MAX_TETHER_DISTANCE = 350;
export const OVERDRIVE_DISTANCE = 150; // Distance to trigger overdrive
export const TETHER_DAMAGE_WIDTH = 8;
export const RESONANCE_COOLDOWN = 300; // Frames

export const MAX_LEVEL = 20; // The goal

export const COLORS = {
  p1: '#ef4444', // Red-500
  p1Glow: '#fca5a5',
  p2: '#3b82f6', // Blue-500
  p2Glow: '#93c5fd',
  tether: '#d8b4fe', // Purple-300
  tetherOverdrive: '#fbbf24', // Amber-400 (Gold)
  tetherCore: '#ffffff',
  enemy: '#22c55e', // Green-500
  enemyDrifter: '#eab308', // Yellow
  enemyDasher: '#f97316', // Orange
  boss: '#a855f7', // Purple
  bossWeakness: '#ffffff',
  background: '#050505',
  uiText: '#ffffff',
  powerupRepair: '#10b981', // Emerald
  powerupCharge: '#f472b6', // Pink
  textDamage: '#ffffff',
  textScore: '#fbbf24'
};

export const INITIAL_STATS = {
  score: 0,
  level: 1,
  integrity: 100,
  maxIntegrity: 100,
  resonanceCharge: 100,
  combo: 0,
  maxCombo: 0
};