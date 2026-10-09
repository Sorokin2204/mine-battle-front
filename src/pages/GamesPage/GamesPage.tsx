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
import Icon from '@/components/common/Icon/Icon';
import { uiConfig } from '@/config/ui.config';

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

  const handleFilterBlur = () => {
    setAppliedFilter({
      min: filterMin ? parseInt(filterMin, 10) : null,
      max: filterMax ? parseInt(filterMax, 10) : null,
    });
  };

  const handleResetFilter = () => {
    setFilterMin('');
    setFilterMax('');
    setAppliedFilter({ min: null, max: null });
    setSortOrder('desc');
    setActiveTab('all');
  };

  const hasActiveFilter = appliedFilter.min !== null || appliedFilter.max !== null || activeTab !== 'all' || sortOrder !== 'desc';

  // Filter and sort defenses
  let filteredDefenses = defenses.filter((d) => d.status !== 'FINISHED' && d.status !== 'EXPIRED' && d.status !== 'CANCELLED');

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
    { id: 'all' as TabType, label: uiConfig.games.tabs.all },
    { id: 'waiting' as TabType, label: uiConfig.games.tabs.waiting },
    { id: 'attacking' as TabType, label: uiConfig.games.tabs.attacking },
  ];

  return (
    <div className={styles.page}>
      <motion.div className={styles.header} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        {' '}
        <button className={clsx(styles.filterBtn, { [styles['filterBtn--active']]: hasActiveFilter || showFilter })} onClick={() => setShowFilter(!showFilter)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <path fill="#7486b7" d="M5.05 3C3.291 3 2.352 5.024 3.51 6.317l5.422 6.059v4.874c0 .472.227.917.613 1.2l3.069 2.25c1.01.742 2.454.036 2.454-1.2v-7.124l5.422-6.059C21.647 5.024 20.708 3 18.95 3z" />
          </svg>
          {hasActiveFilter && <span className={styles.filterDot} />}
        </button>
        <h1 className={styles.title}>
          {uiConfig.games.title} <span>{filteredDefenses.length}</span> <img src={uiConfig.icons.defense} width="32px" alt="" />
        </h1>
        <button className={styles.filterBtn} onClick={() => navigate('/history')}>
          <Icon icon="timer" size={20} />
        </button>
      </motion.div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.headerRight}></div>
      </div>

      {/* Filter popup */}
      <AnimatePresence>
        {showFilter && (
          <motion.div className={styles.filterPopup} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Tabs inside popup */}
            <div className={styles.filterSection}>
              <label className={styles.filterSectionLabel}>{uiConfig.games.status}</label>
              <div className={styles.tabs}>
                {tabs.map((tab) => (
                  <button key={tab.id} className={clsx(styles.tab, { [styles['tab--active']]: activeTab === tab.id })} onClick={() => setActiveTab(tab.id)}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort inside popup */}
            <div className={styles.filterSection}>
              <label className={styles.filterSectionLabel}>{uiConfig.games.sorting}</label>
              <div className={styles.sortOptions}>
                <button className={clsx(styles.sortOption, { [styles['sortOption--active']]: sortOrder === 'desc' })} onClick={() => setSortOrder('desc')}>
                  <span className={styles.sortIcon}>{uiConfig.common.currency}</span>
                  {uiConfig.games.descending}
                </button>
                <button className={clsx(styles.sortOption, { [styles['sortOption--active']]: sortOrder === 'asc' })} onClick={() => setSortOrder('asc')}>
                  <span className={styles.sortIcon}>{uiConfig.common.currency}</span>
                  {uiConfig.games.ascending}
                </button>
              </div>
            </div>

            {/* Bet filter */}
            <div className={styles.filterSection}>
              <label className={styles.filterSectionLabel}>{uiConfig.games.bet}</label>
              <div className={styles.filterInputs}>
                <div className={styles.filterField}>
                  <input type="number" value={filterMin} onChange={(e) => setFilterMin(e.target.value)} onBlur={handleFilterBlur} placeholder={uiConfig.games.from} />
                </div>
                <span className={styles.filterDash}>—</span>
                <div className={styles.filterField}>
                  <input type="number" value={filterMax} onChange={(e) => setFilterMax(e.target.value)} onBlur={handleFilterBlur} placeholder={uiConfig.games.to} />
                </div>
              </div>
            </div>

            {/* Reset button */}
            <div className={styles.filterActions}>
              <button className={styles.filterReset} onClick={handleResetFilter}>
                {uiConfig.games.resetFilters}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.list}>
        <AnimatePresence mode="popLayout">
          {filteredDefenses.length > 0 ? (
            filteredDefenses.map((defense, index) => (
              <motion.div key={defense.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.05 }} layout>
                <DefenseCard defense={defense} isOwn={defense.creator.id === user?.id} onClick={() => handleCardClick(defense.id)} />
              </motion.div>
            ))
          ) : (
            <motion.div className={styles.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <img className={styles.emptyIcon} src="/robber-with-money.png" alt="" />
              <p className={styles.emptyText}>{uiConfig.games.emptyTitle}</p>
              <p className={styles.emptyHint}>{uiConfig.games.emptyHint}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* <motion.button
        type="button"
        className={styles.createDefenseButton}
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate('/create-defense')}>
        <img src="/shield_small.webp" alt="" />
        <span>Создать защиту</span>
      </motion.button> */}
    </div>
  );
};

export default GamesPage;
