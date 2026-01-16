import React from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import styles from './Header.module.scss';
import Avatar from '@/components/common/Avatar';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { openDevLogin } from '@/redux/slices/ui.slice';
import { logout } from '@/redux/slices/auth.slice';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const isDev = import.meta.env.DEV;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo} onClick={() => navigate('/')}>
          <span className={styles.logoIcon}>💣</span>
          <span className={styles.logoText}>MineBattle</span>
        </div>

        <div className={styles.right}>
          {isAuthenticated && user ? (
            <>
              <div className={styles.balance}>
                <span className={styles.balanceIcon}>⭐</span>
                <span className={styles.balanceAmount}>{user.balance}</span>
              </div>
              <Avatar
                src={user.photoUrl}
                name={user.firstName || user.username}
                size="sm"
              />
              {isDev && (
                <button
                  className={styles.logoutBtn}
                  onClick={() => dispatch(logout())}
                  title="Выйти"
                >
                  ⬅
                </button>
              )}
            </>
          ) : (
            isDev && (
              <button
                className={styles.devLogin}
                onClick={() => dispatch(openDevLogin())}
              >
                Dev Login
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
