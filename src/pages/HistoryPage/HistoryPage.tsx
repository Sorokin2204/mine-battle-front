import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './HistoryPage.module.scss';
import HistoryCard from './HistoryCard';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { openGameLobby } from '@/redux/slices/ui.slice';
import { socketService } from '@/services/socket';
import { DefensePublic } from '@/types';
import { uiConfig } from '@/config/ui.config';

const HistoryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [finishedGames, setFinishedGames] = useState<DefensePublic[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const gamesRef = useRef<DefensePublic[]>([]);
  const requestIdRef = useRef(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadHistory = useCallback(async (offset: number, append: boolean) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    try {
      const page = await socketService.getHistory(offset, 20);
      if (requestId !== requestIdRef.current) return;

      const knownIds = new Set(gamesRef.current.map((game) => game.id));
      const nextGames = append
        ? [...gamesRef.current, ...page.items.filter((game) => !knownIds.has(game.id))]
        : page.items;

      gamesRef.current = nextGames;
      setFinishedGames(nextGames);
      setTotal(page.total);
      setHasMore(page.hasMore);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to load history:', error);
      setHasMore(false);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const reloadHistory = () => {
      gamesRef.current = [];
      setFinishedGames([]);
      setHasMore(true);
      void loadHistory(0, false);
    };

    reloadHistory();

    socketService.on('reconnected', reloadHistory);
    return () => {
      requestIdRef.current += 1;
      socketService.off('reconnected', reloadHistory);
    };
  }, [loadHistory]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadHistory(finishedGames.length, true);
      },
      { rootMargin: '160px 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [finishedGames.length, hasMore, isLoading, loadHistory]);

  const handleCardClick = (defenseId: number) => {
    dispatch(openGameLobby(defenseId));
  };

  return (
    <div className={styles.page}>
      <motion.div className={styles.header} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={styles.title}>
          {uiConfig.history.title} <span>{total}</span> <img src={uiConfig.icons.history} alt="" />
        </h1>
      </motion.div>

      <div className={styles.list}>
        <AnimatePresence mode="popLayout">
          {isLoading && finishedGames.length === 0 ? (
            <div className={styles.loading}>{uiConfig.history.loading}</div>
          ) : finishedGames.length > 0 ? (
            finishedGames.map((defense, index) => (
              <motion.div key={defense.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: (index % 20) * 0.05 }} layout>
                <HistoryCard defense={defense} currentUserId={user?.id} onClick={() => handleCardClick(defense.id)} />
              </motion.div>
            ))
          ) : (
            <motion.div className={styles.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className={styles.emptyIcon}>&#128220;</span>
              <p className={styles.emptyText}>{uiConfig.history.emptyTitle}</p>
              <p className={styles.emptyHint}>{uiConfig.history.emptyHint}</p>
            </motion.div>
          )}
        </AnimatePresence>
        {isLoading && finishedGames.length > 0 && <div className={styles.loading}>{uiConfig.history.loading}</div>}
        <div ref={loadMoreRef} className={styles.loadMoreTrigger} aria-hidden="true" />
      </div>
    </div>
  );
};

export default HistoryPage;
