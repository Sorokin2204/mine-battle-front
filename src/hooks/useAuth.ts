import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useAppDispatch';
import { setCredentials, setLoading, setError, logout, updateBalance } from '@/redux/slices/auth.slice';
import { authWithTelegram } from '@/services/auth';
import { socketService } from '@/services/socket';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const initAuth = async () => {
      // Check if we have a saved token
      const savedToken = localStorage.getItem('token');

      if (savedToken) {
        try {
          // Try to connect with saved token
          await socketService.connect(savedToken);
          const user = await socketService.getMe();

          dispatch(
            setCredentials({
              token: savedToken,
              user,
            })
          );
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem('token');
          dispatch(logout());
          dispatch(setLoading(false));
        }
        return;
      }

      // Check if running in Telegram Mini App
      const tg = (window as any).Telegram?.WebApp;

      if (tg?.initData) {
        try {
          dispatch(setLoading(true));

          const { token, user } = await authWithTelegram(tg.initData);

          dispatch(
            setCredentials({
              token,
              user: {
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                photoUrl: user.photoUrl,
                balance: user.balance,
              },
            })
          );

          await socketService.connect(token);

          // Expand Telegram Mini App
          tg.expand();
          tg.ready();
        } catch (error: any) {
          dispatch(setError(error.message));
        }
      } else {
        // Not in Telegram, just mark as not loading
        dispatch(setLoading(false));
      }
    };

    initAuth();

    // Subscribe to balance updates
    const handleBalanceUpdated = (data: { balance: number }) => {
      dispatch(updateBalance(data.balance));
    };

    socketService.on('balanceUpdated', handleBalanceUpdated);

    return () => {
      socketService.off('balanceUpdated', handleBalanceUpdated);
    };
  }, [dispatch]);

  return { token, isAuthenticated };
};
