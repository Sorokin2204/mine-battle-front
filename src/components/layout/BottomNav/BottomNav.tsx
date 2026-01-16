import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import styles from './BottomNav.module.scss';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: '\u{1F3E0}', label: 'Главная' },
    { path: '/games', icon: '\u{1F3AE}', label: 'Игры' },
    { path: '/leaders', icon: '\u{1F3C6}', label: 'Лидеры' },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {navItems.map((item) => (
          <button
            key={item.path}
            className={clsx(styles.navItem, {
              [styles.active]: location.pathname === item.path,
            })}
            onClick={() => navigate(item.path)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        ))}
        <button
          className={clsx(styles.myGamesBtn, {
            [styles.active]: location.pathname === '/my-games',
          })}
          onClick={() => navigate('/my-games')}
        >
          Мои игры
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
