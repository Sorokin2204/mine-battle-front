import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './HistoryPage.module.scss';
import HistoryCard from './HistoryCard';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { openGameLobby } from '@/redux/slices/ui.slice';
import { socketService } from '@/services/socket';
import { DefensePublic } from '@/types';

const HistoryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [finishedGames, setFinishedGames] = useState<DefensePublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const data = await socketService.getDefenses({ includeFinished: true });
        const finished = data
          .filter((d) => d.status === 'FINISHED')
          .sort((a, b) => {
            // Sort by finishedAt descending (newest first)
            const dateA = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
            const dateB = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
            return dateB - dateA;
          });
        setFinishedGames(finished);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();

    socketService.on('reconnected', loadHistory);
    return () => socketService.off('reconnected', loadHistory);
  }, []);

  const handleCardClick = (defenseId: number) => {
    dispatch(openGameLobby(defenseId));
  };

  return (
    <div className={styles.page}>
      <motion.div className={styles.header} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={styles.title}>
          История игр <span>{finishedGames.length}</span> <img src="/history3.png" />
        </h1>
      </motion.div>

      <div className={styles.list}>
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className={styles.loading}>Загрузка...</div>
          ) : finishedGames.length > 0 ? (
            finishedGames.map((defense, index) => (
              <motion.div key={defense.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.05 }} layout>
                <HistoryCard defense={defense} currentUserId={user?.id} onClick={() => handleCardClick(defense.id)} />
              </motion.div>
            ))
          ) : (
            <motion.div className={styles.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className={styles.emptyIcon}>&#128220;</span>
              <p className={styles.emptyText}>История пуста</p>
              <p className={styles.emptyHint}>Завершенные игры появятся здесь</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HistoryPage;
