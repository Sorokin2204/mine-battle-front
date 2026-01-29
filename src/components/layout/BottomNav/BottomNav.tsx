import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import styles from './BottomNav.module.scss';
import Icon from '@/components/common/Icon/Icon';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: 'home', label: 'Главная' },
    { path: '/games', icon: 'mines', label: 'Игры' },
    { path: '/leaders', icon: 'users', label: 'Лидеры' },
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
            onClick={() => navigate(item.path)}>
            <span className={styles.icon}>
              <Icon icon={item.icon} />
            </span>
            {/* <span className={styles.label}>{item.label}</span> */}
          </button>
        ))}
        <button
          className={clsx(styles.myGamesBtn, {
            [styles.active]: location.pathname === '/my-games',
          })}
          onClick={() => navigate('/my-games')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24">
            <path
              fill="none"
              stroke="#fff"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 11h4M8 9v4m7-1h.01M18 10h.01m-.69-5H6.68a4 4 0 0 0-3.978 3.59l-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258q-.01-.075-.017-.151A4 4 0 0 0 17.32 5"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
