import { GameConfig } from '@/types';

export const gameConfig: GameConfig = {
  fieldSize: 3,
  bombsCount: 2,
  attempts: 4,
  scanners: 1,
  radars: 1,
  moveTime: 120000,
  defenseLifetime: 3600000,
  resultsDisplayTime: 10000,
  minBet: 20,
  maxBet: 10000,
  quickBets: [20, 50, 100, 200],
};

export const API_URL = import.meta.env.VITE_API_URL || '';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';
