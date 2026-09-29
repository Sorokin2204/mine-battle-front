import { GameConfig, DifficultyLevel } from '@/types';

export const difficultyConfigs: Record<DifficultyLevel, GameConfig> = {
  EASY: {
    fieldSize: 3,
    bombsCount: 2,
    attempts: 2,
    scanners: 1,
    radars: 2,
    moveTime: 3600000,
    defenseLifetime: 1200000,
    resultsDisplayTime: 10000,
    minBet: 20,
    maxBet: 10000,
    quickBets: [20, 50, 100, 200],
  },
  MEDIUM: {
    fieldSize: 4,
    bombsCount: 1,
    attempts: 1,
    scanners: 1,
    radars: 2,
    moveTime: 3600000,
    defenseLifetime: 1200000,
    resultsDisplayTime: 10000,
    minBet: 20,
    maxBet: 10000,
    quickBets: [20, 50, 100, 200],
  },
  HARD: {
    fieldSize: 5,
    bombsCount: 3,
    attempts: 5,
    scanners: 2,
    radars: 3,
    moveTime: 3600000,
    defenseLifetime: 1200000,
    resultsDisplayTime: 10000,
    minBet: 20,
    maxBet: 10000,
    quickBets: [20, 50, 100, 200],
  },
};

export const getConfigByDifficulty = (difficulty: DifficultyLevel): GameConfig => {
  return difficultyConfigs[difficulty];
};

// Default config for backwards compatibility
export const gameConfig: GameConfig = difficultyConfigs.MEDIUM;

// In local development these defaults keep API and WebSocket connections on
// the same LAN address that the browser used to open the app. Vite proxies
// them to the backend, so a phone must never try to connect to its own
// `localhost`.
export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
