import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/config/game.config';
import { DefensePublic, MoveResult, SocketResponse, UserWithBalance, MoveType, DifficultyLevel } from '@/types';

interface ServerToClientEvents {
  defenseCreated: (defense: DefensePublic) => void;
  defenseUpdated: (defense: DefensePublic) => void;
  defenseRemoved: (defenseId: number) => void;
  gameStarted: (defense: DefensePublic) => void;
  moveMade: (data: { defenseId: number; move: MoveResult }) => void;
  gameFinished: (defense: DefensePublic) => void;
  timerUpdate: (data: { defenseId: number; timeLeft: number; type: 'move' | 'defense' }) => void;
  balanceUpdated: (data: { balance: number }) => void;
  error: (data: { message: string; code?: string }) => void;
  matchFound: (data: { defenseId: number; defense: DefensePublic }) => void;
  matchmakingStarted: (data: { queuePosition: number }) => void;
}

interface ClientToServerEvents {
  createDefense: (
    data: { bet: number; bombPositions: number[]; difficulty: DifficultyLevel },
    callback: (response: SocketResponse<DefensePublic>) => void
  ) => void;
  attackDefense: (
    data: { defenseId: number },
    callback: (response: SocketResponse<DefensePublic>) => void
  ) => void;
  makeMove: (
    data: { defenseId: number; moveType: MoveType; position?: number; positions?: number[] },
    callback: (response: SocketResponse<MoveResult>) => void
  ) => void;
  takeHalf: (
    data: { defenseId: number },
    callback: (response: SocketResponse<DefensePublic>) => void
  ) => void;
  getDefenses: (
    dataOrCallback: { includeFinished?: boolean; includeExpired?: boolean } | ((response: SocketResponse<DefensePublic[]>) => void),
    callback?: (response: SocketResponse<DefensePublic[]>) => void
  ) => void;
  getDefense: (
    data: { defenseId: number },
    callback: (response: SocketResponse<DefensePublic>) => void
  ) => void;
  joinDefenseRoom: (data: { defenseId: number }) => void;
  leaveDefenseRoom: (data: { defenseId: number }) => void;
  getMe: (callback: (response: SocketResponse<UserWithBalance>) => void) => void;
  startMatchmaking: (
    data: { minBet: number; maxBet: number; difficulty?: DifficultyLevel },
    callback: (response: SocketResponse<{ queuePosition: number }>) => void
  ) => void;
  stopMatchmaking: (callback: (response: SocketResponse<null>) => void) => void;
}

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private socket: GameSocket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private hasConnected = false;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        const isReconnect = this.hasConnected;
        this.hasConnected = true;
        this.emit('connected', undefined);
        if (isReconnect) {
          this.emit('reconnected', undefined);
        }
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      // Set up event forwarding
      this.setupEventForwarding();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.hasConnected = false;
    }
    this.listeners.clear();
  }

  private setupEventForwarding() {
    if (!this.socket) return;

    const events: (keyof ServerToClientEvents)[] = [
      'defenseCreated',
      'defenseUpdated',
      'defenseRemoved',
      'gameStarted',
      'moveMade',
      'gameFinished',
      'timerUpdate',
      'balanceUpdated',
      'error',
      'matchFound',
      'matchmakingStarted',
    ];

    events.forEach((event) => {
      this.socket?.on(event, (data: any) => {
        this.emit(event, data);
      });
    });
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  // Game methods
  createDefense(bet: number, bombPositions: number[], difficulty: DifficultyLevel): Promise<DefensePublic> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('createDefense', { bet, bombPositions, difficulty }, (response) => {
        if (response.success && response.data) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Failed to create defense'));
        }
      });
    });
  }

  attackDefense(defenseId: number): Promise<DefensePublic> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('attackDefense', { defenseId }, (response) => {
        if (response.success && response.data) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Failed to attack defense'));
        }
      });
    });
  }

  makeMove(
    defenseId: number,
    moveType: MoveType,
    position?: number,
    positions?: number[]
  ): Promise<MoveResult> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('makeMove', { defenseId, moveType, position, positions }, (response) => {
        if (response.success && response.data) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Failed to make move'));
        }
      });
    });
  }

  takeHalf(defenseId: number): Promise<DefensePublic> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('takeHalf', { defenseId }, (response) => {
        if (response.success && response.data) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Failed to take half'));
        }
      });
    });
  }

  getDefenses(options?: { includeFinished?: boolean; includeExpired?: boolean }): Promise<DefensePublic[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      const callback = (response: SocketResponse<DefensePublic[]>) => {
        if (response.success && response.data) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Failed to get defenses'));
        }
      };

      if (options?.includeFinished || options?.includeExpired) {
        this.socket.emit('getDefenses', {
          includeFinished: options.includeFinished ?? false,
          includeExpired: options.includeExpired ?? false
        }, callback);
      } else {
        this.socket.emit('getDefenses', callback);
      }
    });
  }

  getDefense(defenseId: number): Promise<DefensePublic> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('getDefense', { defenseId }, (response) => {
        if (response.success && response.data) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Failed to get defense'));
        }
      });
    });
  }

  joinDefenseRoom(defenseId: number) {
    this.socket?.emit('joinDefenseRoom', { defenseId });
  }

  leaveDefenseRoom(defenseId: number) {
    this.socket?.emit('leaveDefenseRoom', { defenseId });
  }

  getMe(): Promise<UserWithBalance> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('getMe', (response) => {
        if (response.success && response.data) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Failed to get user'));
        }
      });
    });
  }

  startMatchmaking(minBet: number, maxBet: number, difficulty?: DifficultyLevel): Promise<{ queuePosition: number }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('startMatchmaking', { minBet, maxBet, difficulty }, (response) => {
        if (response.success && response.data) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Failed to start matchmaking'));
        }
      });
    });
  }

  stopMatchmaking(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('stopMatchmaking', (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to stop matchmaking'));
        }
      });
    });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
