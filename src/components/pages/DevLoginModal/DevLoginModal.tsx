import React, { useState } from 'react';
import styles from './DevLoginModal.module.scss';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { closeDevLogin, showToast } from '@/redux/slices/ui.slice';
import { setCredentials, setLoading } from '@/redux/slices/auth.slice';
import { authWithDevCode } from '@/services/auth';
import { socketService } from '@/services/socket';

const DevLoginModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.devLoginModal);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    dispatch(closeDevLogin());
    setCode('');
  };

  const handleLogin = async () => {
    if (code.length !== 4) {
      dispatch(showToast({ message: 'Введите 4-значный код', type: 'error' }));
      return;
    }

    try {
      setIsLoading(true);
      dispatch(setLoading(true));

      const { token, user } = await authWithDevCode(code);

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

      dispatch(showToast({ message: 'Успешный вход!', type: 'success' }));
      handleClose();
    } catch (error: any) {
      dispatch(showToast({ message: error.message || 'Ошибка входа', type: 'error' }));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCode(value);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Dev Login">
      <div className={styles.content}>
        <p className={styles.hint}>Введите код для входа в тестовый аккаунт</p>
        <p className={styles.codes}>Доступные коды: 1001, 1002, 1003, 1004</p>

        <input
          type="text"
          value={code}
          onChange={handleCodeChange}
          placeholder="0000"
          className={styles.input}
          maxLength={4}
          autoFocus
        />

        <Button
          color="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={code.length !== 4}
          onClick={handleLogin}
        >
          Войти
        </Button>
      </div>
    </Modal>
  );
};

export default DevLoginModal;
