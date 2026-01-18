export type DefenseStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'EXPIRED' | 'CANCELLED';
export type GameResult = 'ATTACKER_WIN' | 'DEFENDER_WIN' | 'ATTACKER_TOOK_HALF' | 'TIMEOUT' | 'EXPIRED';
export type MoveType = 'CLICK' | 'SCANNER' | 'RADAR' | 'TAKE_HALF';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface UserPublic {
  id: number;
  username: string | null;
  firstName: string | null;
  photoUrl: string | null;
}

export interface UserWithBalance extends UserPublic {
  balance: number;
}

export interface ScannerResult {
  positions: number[];
  bombCount: number;
}

export interface RadarResult {
  type: 'row' | 'column';
  index: number;
  bombCount: number;
}

export interface DefensePublic {
  id: number;
  creator: UserPublic;
  attacker: UserPublic | null;
  bet: number;
  difficulty: DifficultyLevel;
  status: DefenseStatus;
  expiresAt: string;
  attackStartedAt: string | null;
  moveDeadline: string | null;
  attemptsUsed: number;
  scannersUsed: number;
  radarsUsed: number;
  bombsFound: number;
  revealedCells: number[];
  foundBombPositions: number[]; // Positions where bombs were found during game
  scannerResults: ScannerResult[] | null;
  radarResults: RadarResult[] | null;
  result: GameResult | null;
  winnerId: number | null;
  createdAt: string;
  finishedAt: string | null;
  bombPositions?: number[];
}

export interface MoveResult {
  success: boolean;
  moveType: MoveType;
  position?: number;
  positions?: number[];
  isBomb?: boolean;
  bombCount?: number;
  bombsFound: number;
  attemptsUsed: number;
  scannersUsed: number;
  radarsUsed: number;
  gameFinished: boolean;
  result?: GameResult;
  revealedCells: number[];
}

export interface SocketResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface GameConfig {
  fieldSize: number;
  bombsCount: number;
  attempts: number;
  scanners: number;
  radars: number;
  moveTime: number;
  defenseLifetime: number;
  resultsDisplayTime: number;
  minBet: number;
  maxBet: number;
  quickBets: number[];
}
