import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import styles from './MyGamesPage.module.scss';
import MyGameCard from './MyGameCard';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { setDefenses, addDefense, updateDefense, removeDefense } from '@/redux/slices/game.slice';
import { openGameLobby } from '@/redux/slices/ui.slice';
import { socketService } from '@/services/socket';
import { DefensePublic } from '@/types';

type TabType = 'all' | 'attacks' | 'defenses';

const MyGamesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { defenses } = useAppSelector((state) => state.game);
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<TabType>('all');

  useEffect(() => {
    const loadDefenses = async () => {
      try {
        const data = await socketService.getDefenses({ includeFinished: true, includeExpired: true });
        dispatch(setDefenses(data));
      } catch (error) {
        console.error('Failed to load defenses:', error);
      }
    };

    loadDefenses();

    const handleDefenseCreated = (defense: DefensePublic) => {
      dispatch(addDefense(defense));
    };

    const handleDefenseUpdated = (defense: DefensePublic) => {
      dispatch(updateDefense(defense));
    };

    const handleDefenseRemoved = (defenseId: number) => {
      dispatch(removeDefense(defenseId));
    };

    socketService.on('defenseCreated', handleDefenseCreated);
    socketService.on('defenseUpdated', handleDefenseUpdated);
    socketService.on('defenseRemoved', handleDefenseRemoved);
    socketService.on('reconnected', loadDefenses);

    return () => {
      socketService.off('defenseCreated', handleDefenseCreated);
      socketService.off('defenseUpdated', handleDefenseUpdated);
      socketService.off('defenseRemoved', handleDefenseRemoved);
      socketService.off('reconnected', loadDefenses);
    };
  }, [dispatch]);

  const handleCardClick = (defenseId: number) => {
    dispatch(openGameLobby(defenseId));
  };

  // Sort function - newest first based on createdAt
  const sortByNewest = (games: DefensePublic[]) => {
    return [...games].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  };

  // Filter games based on user
  const myAttacks = sortByNewest(defenses.filter((d) => d.attacker?.id === user?.id));
  const myDefenses = sortByNewest(defenses.filter((d) => d.creator.id === user?.id));
  const allMyGames = sortByNewest([...new Map([...myAttacks, ...myDefenses].map((d) => [d.id, d])).values()]);

  let filteredGames: DefensePublic[] = [];
  let pageTitle = '';

  switch (activeTab) {
    case 'attacks':
      filteredGames = myAttacks;
      pageTitle = `Мои атаки (${myAttacks.length})`;
      break;
    case 'defenses':
      filteredGames = myDefenses;
      pageTitle = `Мои защиты (${myDefenses.length})`;
      break;
    default:
      filteredGames = allMyGames;
      pageTitle = `Все мои игры (${allMyGames.length})`;
  }

  const tabs = [
    { id: 'all' as TabType, label: 'Все' },
    { id: 'attacks' as TabType, label: 'Мои атаки' },
    { id: 'defenses' as TabType, label: 'Мои защиты' },
  ];

  return (
    <div className={styles.page}>
      <motion.div className={styles.header} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={styles.title}>{pageTitle}</h1>
      </motion.div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={clsx(styles.tab, { [styles['tab--active']]: activeTab === tab.id })}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        <AnimatePresence mode="popLayout">
          {filteredGames.length > 0 ? (
            filteredGames.map((defense, index) => (
              <motion.div
                key={defense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <MyGameCard
                  defense={defense}
                  currentUserId={user?.id}
                  onClick={() => handleCardClick(defense.id)}
                />
              </motion.div>
            ))
          ) : (
            <motion.div className={styles.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className={styles.emptyIcon}>&#127918;</span>
              <p className={styles.emptyText}>Нет игр</p>
              <p className={styles.emptyHint}>Создайте защиту или атакуйте противника</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyGamesPage;
