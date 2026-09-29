import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import styles from './BottomNav.module.scss';
import Icon from '@/components/common/Icon/Icon';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const leftNavItems = [
    { path: '/', icon: 'home', label: 'Главная' },
    { path: '/games', icon: 'mines', label: 'Игры' },
  ];

  const rightNavItem = { path: '/leaders', icon: 'users', label: 'Лидеры' };

  useEffect(() => {
    setIsActionMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isActionMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsActionMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActionMenuOpen]);

  const goTo = (path: string) => {
    setIsActionMenuOpen(false);
    navigate(path);
  };

  const renderNavItem = (item: (typeof leftNavItems)[number]) => (
    <button
      key={item.path}
      type="button"
      aria-label={item.label}
      className={clsx(styles.navItem, {
        [styles.active]: location.pathname === item.path,
      })}
      onClick={() => goTo(item.path)}>
      <span className={styles.icon}>
        <Icon icon={item.icon} />
      </span>
    </button>
  );

  return (
    <>
      <AnimatePresence>
        {isActionMenuOpen && (
          <>
            <motion.button
              type="button"
              className={styles.overlay}
              aria-label="Закрыть меню действий"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsActionMenuOpen(false)}
            />

            <motion.div
              className={styles.actionMenu}
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: { transition: { staggerChildren: 0.06, staggerDirection: -1 } },
                closed: { transition: { staggerChildren: 0.04 } },
              }}>
              <motion.button
                type="button"
                className={clsx(styles.actionButton, styles.attackButton)}
                variants={{ closed: { opacity: 0, y: 28 }, open: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.22 }}
                onClick={() => goTo('/games')}>
                <img src="/two-swords.webp" alt="" />
                <span>Атаковать</span>
              </motion.button>

              <motion.button
                type="button"
                className={clsx(styles.actionButton, styles.autoMatchButton)}
                variants={{ closed: { opacity: 0, y: 28 }, open: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.22 }}
                onClick={() => goTo('/search-attack')}>
                <img src="/search-1.png" alt="" />
                <span>Автоподбор</span>
              </motion.button>

              <motion.button
                type="button"
                className={styles.actionButton}
                variants={{ closed: { opacity: 0, y: 28 }, open: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.22 }}
                onClick={() => goTo('/create-defense')}>
                <img src="/shield_small.webp" alt="" />
                <span>Создать защиту</span>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className={styles.nav} aria-label="Основная навигация">
        <div className={styles.container}>
          {leftNavItems.map(renderNavItem)}

          <button
            type="button"
            className={clsx(styles.centerBtn, { [styles.menuOpen]: isActionMenuOpen })}
            aria-label={isActionMenuOpen ? 'Закрыть меню действий' : 'Открыть меню действий'}
            aria-expanded={isActionMenuOpen}
            onClick={() => setIsActionMenuOpen((isOpen) => !isOpen)}>
            <Icon icon="plus" />
          </button>

          {renderNavItem(rightNavItem)}

          <button
            type="button"
            aria-label="Мои игры"
            className={clsx(styles.myGamesBtn, {
              [styles.active]: location.pathname === '/my-games',
            })}
            onClick={() => goTo('/my-games')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24">
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 11h4M8 9v4m7-1h.01M18 10h.01m-.69-5H6.68a4 4 0 0 0-3.978 3.59l-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258q-.01-.075-.017-.151A4 4 0 0 0 17.32 5"
              />
            </svg>
          </button>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
