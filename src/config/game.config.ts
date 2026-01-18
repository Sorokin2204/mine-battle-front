import { GameConfig, DifficultyLevel } from '@/types';

export const difficultyConfigs: Record<DifficultyLevel, GameConfig> = {
  EASY: {
    fieldSize: 3,
    bombsCount: 1,
    attempts: 3,
    scanners: 1,
    radars: 1,
    moveTime: 120000,
    defenseLifetime: 120000,
    resultsDisplayTime: 10000,
    minBet: 20,
    maxBet: 10000,
    quickBets: [20, 50, 100, 200],
  },
  MEDIUM: {
    fieldSize: 4,
    bombsCount: 2,
    attempts: 4,
    scanners: 2,
    radars: 2,
    moveTime: 120000,
    defenseLifetime: 120000,
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
    moveTime: 120000,
    defenseLifetime: 120000,
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

export const API_URL = import.meta.env.VITE_API_URL || '';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';
