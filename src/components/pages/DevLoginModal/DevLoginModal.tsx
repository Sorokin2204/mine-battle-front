import React, { useState } from 'react';
import styles from './DevLoginModal.module.scss';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { closeDevLogin, showToast } from '@/redux/slices/ui.slice';
import { setCredentials, setLoading } from '@/redux/slices/auth.slice';
import { authWithDevCode } from '@/services/auth';
import { socketService } from '@/services/socket';
import { uiConfig } from '@/config/ui.config';

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
      dispatch(showToast({ message: uiConfig.devLogin.invalidCode, type: 'error' }));
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

      dispatch(showToast({ message: uiConfig.devLogin.success, type: 'success' }));
      handleClose();
    } catch (error: any) {
      dispatch(showToast({ message: error.message || uiConfig.devLogin.error, type: 'error' }));
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
    <Modal isOpen={isOpen} onClose={handleClose} title={uiConfig.header.devLogin}>
      <div className={styles.content}>
        <p className={styles.hint}>{uiConfig.devLogin.titleHint}</p>
        <p className={styles.codes}>{uiConfig.devLogin.availableCodes}</p>

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
          {uiConfig.devLogin.submit}
        </Button>
      </div>
    </Modal>
  );
};

export default DevLoginModal;
