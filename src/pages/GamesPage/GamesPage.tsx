import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import styles from './GamesPage.module.scss';
import DefenseCard from './DefenseCard';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { setDefenses, addDefense, updateDefense, removeDefense } from '@/redux/slices/game.slice';
import { openGameLobby } from '@/redux/slices/ui.slice';
import { socketService } from '@/services/socket';
import { DefensePublic } from '@/types';

type TabType = 'all' | 'waiting' | 'attacking';
type SortOrder = 'asc' | 'desc';

const GamesPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { defenses } = useAppSelector((state) => state.game);
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilter, setShowFilter] = useState(false);
  const [filterMin, setFilterMin] = useState('');
  const [filterMax, setFilterMax] = useState('');
  const [appliedFilter, setAppliedFilter] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });

  useEffect(() => {
    const loadDefenses = async () => {
      try {
        const data = await socketService.getDefenses();
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

    return () => {
      socketService.off('defenseCreated', handleDefenseCreated);
      socketService.off('defenseUpdated', handleDefenseUpdated);
      socketService.off('defenseRemoved', handleDefenseRemoved);
    };
  }, [dispatch]);

  const handleCardClick = (defenseId: number) => {
    dispatch(openGameLobby(defenseId));
  };

  const handleApplyFilter = () => {
    setAppliedFilter({
      min: filterMin ? parseInt(filterMin, 10) : null,
      max: filterMax ? parseInt(filterMax, 10) : null,
    });
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterMin('');
    setFilterMax('');
    setAppliedFilter({ min: null, max: null });
    setShowFilter(false);
  };

  const hasActiveFilter = appliedFilter.min !== null || appliedFilter.max !== null;

  // Filter and sort defenses
  let filteredDefenses = defenses.filter(
    (d) => d.status !== 'FINISHED' && d.status !== 'EXPIRED' && d.status !== 'CANCELLED'
  );

  // Apply tab filter
  if (activeTab === 'waiting') {
    filteredDefenses = filteredDefenses.filter((d) => d.status === 'WAITING');
  } else if (activeTab === 'attacking') {
    filteredDefenses = filteredDefenses.filter((d) => d.status === 'IN_PROGRESS');
  }

  // Apply bet filter
  if (appliedFilter.min !== null) {
    filteredDefenses = filteredDefenses.filter((d) => d.bet >= appliedFilter.min!);
  }
  if (appliedFilter.max !== null) {
    filteredDefenses = filteredDefenses.filter((d) => d.bet <= appliedFilter.max!);
  }

  // Apply sorting
  filteredDefenses = [...filteredDefenses].sort((a, b) => {
    return sortOrder === 'desc' ? b.bet - a.bet : a.bet - b.bet;
  });

  const tabs = [
    { id: 'all' as TabType, label: 'Все' },
    { id: 'waiting' as TabType, label: 'Ждут атаки' },
    { id: 'attacking' as TabType, label: 'Атакуют' },
  ];

  return (
    <div className={styles.page}>
      <motion.div className={styles.header} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={styles.title}>Защиты ({filteredDefenses.length})</h1>
      </motion.div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <button
          className={clsx(styles.filterBtn, { [styles['filterBtn--active']]: hasActiveFilter })}
          onClick={() => setShowFilter(!showFilter)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
          </svg>
          {hasActiveFilter && <span className={styles.filterDot} />}
        </button>

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

        <button className={styles.sortBtn} onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
          <span className={styles.sortIcon}>&#9733;</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={clsx(styles.sortArrow, { [styles['sortArrow--asc']]: sortOrder === 'asc' })}
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>

        <button className={styles.historyBtn} onClick={() => navigate('/history')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        </button>
      </div>

      {/* Filter popup */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            className={styles.filterPopup}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className={styles.filterInputs}>
              <div className={styles.filterField}>
                <label>От</label>
                <input
                  type="number"
                  value={filterMin}
                  onChange={(e) => setFilterMin(e.target.value)}
                  placeholder="0"
                />
              </div>
              <span className={styles.filterDash}>-</span>
              <div className={styles.filterField}>
                <label>До</label>
                <input
                  type="number"
                  value={filterMax}
                  onChange={(e) => setFilterMax(e.target.value)}
                  placeholder="10000"
                />
              </div>
            </div>
            <div className={styles.filterActions}>
              <button className={styles.filterApply} onClick={handleApplyFilter}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </button>
              <button className={styles.filterReset} onClick={handleResetFilter}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.list}>
        <AnimatePresence mode="popLayout">
          {filteredDefenses.length > 0 ? (
            filteredDefenses.map((defense, index) => (
              <motion.div
                key={defense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <DefenseCard
                  defense={defense}
                  isOwn={defense.creator.id === user?.id}
                  onClick={() => handleCardClick(defense.id)}
                />
              </motion.div>
            ))
          ) : (
            <motion.div className={styles.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className={styles.emptyIcon}>&#127919;</span>
              <p className={styles.emptyText}>Нет активных защит</p>
              <p className={styles.emptyHint}>Создайте первую защиту!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GamesPage;
