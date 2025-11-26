
export enum GameState {
  MENU,
  TUTORIAL, // New state for the 5s intro
  PLAYING,
  LEVEL_TRANSITION,
  GAME_OVER,
  VICTORY
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2;
  radius: number;
  active: boolean;
}

export interface Player extends Entity {
  color: string;
  speed: number;
  trail: Vector2[]; // For visual trails
}

export interface Enemy extends Entity {
  velocity: Vector2;
  type: 'chaser' | 'drifter' | 'dasher' | 'minion';
  hp: number;
  maxHp: number;
  value: number;
}

export interface Boss extends Entity {
  hp: number;
  maxHp: number;
  phase: number;
  attackTimer: number;
}

export interface Particle extends Entity {
  velocity: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  behavior?: 'drift' | 'seek'; // 'seek' will fly towards players
}

export interface PowerUp extends Entity {
  type: 'repair' | 'charge';
  life: number;
}

export interface FloatingText {
  id: string;
  pos: Vector2;
  text: string;
  color: string;
  life: number;
  size: number;
  velocity: Vector2;
}

export interface GameStats {
  score: number;
  level: number;
  integrity: number; // Health (0-100)
  maxIntegrity: number;
  resonanceCharge: number; // 0-100, allows special attack
  combo: number;
  maxCombo: number;
}

export interface StoryLog {
  chapter: string;
  title: string;
  content: string;
  visualCue: string; // e.g., "The screen flickers red"
  mood: 'neutral' | 'danger' | 'hopeful' | 'victory';
}
