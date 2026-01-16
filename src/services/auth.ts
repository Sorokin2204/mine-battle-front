import { API_URL } from '@/config/game.config';

interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string | null;
    firstName: string | null;
    photoUrl: string | null;
    balance: number;
  };
}

export async function authWithTelegram(initData: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/telegram`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    throw new Error('Telegram authentication failed');
  }

  return response.json();
}

export async function authWithDevCode(code: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/dev`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error('Dev authentication failed');
  }

  return response.json();
}
