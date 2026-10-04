import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import styles from './BottomNav.module.scss';
import Icon from '@/components/common/Icon/Icon';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { addDefense, removeDefense, syncActiveDefenses, updateDefense } from '@/redux/slices/game.slice';
import { socketService } from '@/services/socket';
import { DefensePublic } from '@/types';
import { uiConfig } from '@/config/ui.config';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { defenses } = useAppSelector((state) => state.game);
  const { user } = useAppSelector((state) => state.auth);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const leftNavItems = [
    { path: '/', icon: 'home', label: uiConfig.navigation.items.home },
    { path: '/games', icon: 'mines', label: uiConfig.navigation.items.games },
  ];

  const rightNavItem = { path: '/leaders', icon: 'users', label: uiConfig.navigation.items.leaders };

  useEffect(() => {
    setIsActionMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const synchronize = async () => {
      try {
        const activeDefenses = await socketService.getDefenses();
        dispatch(syncActiveDefenses(activeDefenses));
      } catch {
        // The initial call can happen before authentication finishes; the
        // connected event retries as soon as the socket becomes available.
      }
    };
    const handleCreated = (defense: DefensePublic) => dispatch(addDefense(defense));
    const handleUpdated = (defense: DefensePublic) => dispatch(updateDefense(defense));
    const handleRemoved = (defenseId: number) => dispatch(removeDefense(defenseId));

    socketService.on('connected', synchronize);
    socketService.on('reconnected', synchronize);
    socketService.on('defenseCreated', handleCreated);
    socketService.on('defenseUpdated', handleUpdated);
    socketService.on('defenseRemoved', handleRemoved);
    void synchronize();

    return () => {
      socketService.off('connected', synchronize);
      socketService.off('reconnected', synchronize);
      socketService.off('defenseCreated', handleCreated);
      socketService.off('defenseUpdated', handleUpdated);
      socketService.off('defenseRemoved', handleRemoved);
    };
  }, [dispatch]);

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

  const now = Date.now();
  const activeMyGames = user
    ? defenses.filter((defense) => {
        const belongsToUser = defense.creator.id === user.id || defense.attacker?.id === user.id;
        if (!belongsToUser) return false;

        if (defense.status === 'WAITING') {
          return defense.creator.id === user.id && new Date(defense.expiresAt).getTime() > now;
        }

        return defense.status === 'IN_PROGRESS' && (!defense.moveDeadline || new Date(defense.moveDeadline).getTime() > now);
      })
    : [];
  const activeMyGamesCount = activeMyGames.length;
  const hasActiveAttacks = Boolean(user && activeMyGames.some((defense) => defense.attacker?.id === user.id));
  const hasActiveDefenses = Boolean(user && activeMyGames.some((defense) => defense.creator.id === user.id));
  const myGamesPath = hasActiveDefenses && !hasActiveAttacks ? '/my-games?tab=defenses' : hasActiveAttacks && !hasActiveDefenses ? '/my-games?tab=attacks' : '/my-games';

  const renderNavItem = (item: { path: string; icon: string; label: string }) => (
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
              aria-label={uiConfig.navigation.closeMenu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsActionMenuOpen(false)}
            />

            <motion.div
              className={styles.actionMenu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}>
              <button
                type="button"
                className={clsx(styles.actionButton, styles.attackButton)}
                onClick={() => goTo('/games')}>
                <img src={uiConfig.icons.attack} alt="" />
                <span>{uiConfig.navigation.actions.attack}</span>
              </button>

              <button
                type="button"
                className={clsx(styles.actionButton, styles.autoMatchButton)}
                onClick={() => goTo('/search-attack')}>
                <img src={uiConfig.icons.autoMatch} alt="" />
                <span>{uiConfig.navigation.actions.autoMatch}</span>
              </button>

              <button
                type="button"
                className={styles.actionButton}
                onClick={() => goTo('/create-defense')}>
                <img src={uiConfig.icons.defense} alt="" />
                <span>{uiConfig.navigation.actions.createDefense}</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className={styles.nav} aria-label={uiConfig.navigation.mainLabel}>
        <div className={styles.container}>
          {leftNavItems.map(renderNavItem)}

          <button
            type="button"
            className={clsx(styles.centerBtn, { [styles.menuOpen]: isActionMenuOpen })}
            aria-label={isActionMenuOpen ? uiConfig.navigation.closeMenu : uiConfig.navigation.openMenu}
            aria-expanded={isActionMenuOpen}
            onClick={() => setIsActionMenuOpen((isOpen) => !isOpen)}>
            <Icon icon="plus" />
          </button>

          {renderNavItem(rightNavItem)}

          <button
            type="button"
            aria-label={uiConfig.navigation.myGames}
            className={clsx(styles.myGamesBtn, {
              [styles.active]: location.pathname === '/my-games',
            })}
            onClick={() => goTo(myGamesPath)}>
            <span className={styles.myGamesIcon}>
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
              {activeMyGamesCount > 0 && (
                <span
                  className={clsx(styles.myGamesBadge, {
                    [styles.myGamesBadgeAttack]: hasActiveAttacks && !hasActiveDefenses,
                    [styles.myGamesBadgeDefense]: hasActiveDefenses && !hasActiveAttacks,
                    [styles.myGamesBadgeMixed]: hasActiveAttacks && hasActiveDefenses,
                  })}
                  aria-label={uiConfig.navigation.activeGames(activeMyGamesCount)}>
                  {activeMyGamesCount > 99 ? '99+' : activeMyGamesCount}
                </span>
              )}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
