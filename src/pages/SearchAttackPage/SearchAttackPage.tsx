import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import styles from './SearchAttackPage.module.scss';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { openGameLobby, showToast } from '@/redux/slices/ui.slice';
import { socketService } from '@/services/socket';
import { gameConfig } from '@/config/game.config';
import { DefensePublic } from '@/types';
import { addDefense } from '@/redux/slices/game.slice';
import { uiConfig } from '@/config/ui.config';

type SearchState = 'idle' | 'confirming' | 'searching' | 'found';

const SearchAttackPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [minBet, setMinBet] = useState<number>(gameConfig.minBet);
  const [maxBet, setMaxBet] = useState<number>(gameConfig.maxBet);
  const [minBetInput, setMinBetInput] = useState<string>(String(gameConfig.minBet));
  const [maxBetInput, setMaxBetInput] = useState<string>(String(gameConfig.maxBet));
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [matchedDefense, setMatchedDefense] = useState<DefensePublic | null>(null);

  useEffect(() => {
    // Listen for match found event
    const handleMatchFound = (data: { defenseId: number; defense: DefensePublic }) => {
      console.log('Match found!', data);
      dispatch(addDefense(data.defense));
      setMatchedDefense(data.defense);
      setSearchState('found');

      // Auto-open game lobby after a short delay
      setTimeout(() => {
        dispatch(openGameLobby(data.defenseId));
        setSearchState('idle');
        setMatchedDefense(null);
      }, 1500);
    };

    socketService.on('matchFound', handleMatchFound);

    return () => {
      socketService.off('matchFound', handleMatchFound);
      // Stop matchmaking if component unmounts while searching
      if (searchState === 'searching') {
        socketService.stopMatchmaking().catch(console.error);
      }
    };
  }, [dispatch, searchState]);

  const handleMinBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setMinBetInput(value);
  };

  const handleMaxBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setMaxBetInput(value);
  };

  const handleMinBetBlur = () => {
    const numValue = parseInt(minBetInput, 10);
    if (!minBetInput || isNaN(numValue) || numValue < gameConfig.minBet) {
      setMinBet(gameConfig.minBet);
      setMinBetInput(String(gameConfig.minBet));
    } else {
      setMinBet(numValue);
      setMinBetInput(String(numValue));
    }
  };

  const handleMaxBetBlur = () => {
    const numValue = parseInt(maxBetInput, 10);
    if (!maxBetInput || isNaN(numValue) || numValue < minBet) {
      setMaxBet(Math.max(minBet, gameConfig.minBet));
      setMaxBetInput(String(Math.max(minBet, gameConfig.minBet)));
    } else {
      setMaxBet(numValue);
      setMaxBetInput(String(numValue));
    }
  };

  const handleSearchClick = () => {
    if (!user) {
      dispatch(showToast({ message: uiConfig.searchAttack.authRequired, type: 'error' }));
      return;
    }
    setSearchState('confirming');
  };

  const handleConfirmSearch = async () => {
    try {
      setSearchState('searching');
      await socketService.startMatchmaking(minBet, maxBet);
      dispatch(showToast({ message: uiConfig.searchAttack.started, type: 'info' }));
    } catch (error: any) {
      dispatch(showToast({ message: error.message || uiConfig.searchAttack.error, type: 'error' }));
      setSearchState('idle');
    }
  };

  const handleCancelSearch = async () => {
    try {
      await socketService.stopMatchmaking();
      setSearchState('idle');
      dispatch(showToast({ message: uiConfig.searchAttack.cancelled, type: 'info' }));
    } catch (error: any) {
      console.error('Failed to stop matchmaking:', error);
    }
  };

  const handleCloseConfirm = () => {
    setSearchState('idle');
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={styles.title}>{uiConfig.searchAttack.title}</h1>
        <p className={styles.subtitle}>{uiConfig.searchAttack.subtitle}</p>
      </motion.div>

      <motion.div
        className={styles.paramsSection}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <label className={styles.label}>{uiConfig.searchAttack.betRange}</label>
        <div className={styles.betRange}>
          <div className={styles.betInput}>
            <span className={styles.betIcon}>{uiConfig.common.currency}</span>
            <span className={styles.betLabel}>{uiConfig.searchAttack.from}</span>
            <input
              type="text"
              value={minBetInput}
              onChange={handleMinBetChange}
              onBlur={handleMinBetBlur}
              placeholder={String(gameConfig.minBet)}
              className={styles.input}
              disabled={searchState === 'searching'}
            />
          </div>
          <div className={styles.betInput}>
            <span className={styles.betIcon}>{uiConfig.common.currency}</span>
            <span className={styles.betLabel}>{uiConfig.searchAttack.to}</span>
            <input
              type="text"
              value={maxBetInput}
              onChange={handleMaxBetChange}
              onBlur={handleMaxBetBlur}
              placeholder={String(gameConfig.maxBet)}
              className={styles.input}
              disabled={searchState === 'searching'}
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        className={styles.searchSection}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {searchState === 'idle' && (
            <motion.button
              key="idle"
              className={styles.searchButton}
              onClick={handleSearchClick}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className={styles.searchIcon}>&#128269;</span>
              <span className={styles.searchText}>{uiConfig.searchAttack.search}</span>
            </motion.button>
          )}

          {searchState === 'searching' && (
            <motion.button
              key="searching"
              className={clsx(styles.searchButton, styles.searching)}
              onClick={handleCancelSearch}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <motion.span
                className={styles.searchIcon}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              >
                &#128269;
              </motion.span>
              <span className={styles.searchText}>{uiConfig.searchAttack.searching}</span>
              <span className={styles.cancelHint}>{uiConfig.searchAttack.cancelHint}</span>
            </motion.button>
          )}

          {searchState === 'found' && matchedDefense && (
            <motion.div
              key="found"
              className={clsx(styles.searchButton, styles.found)}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <span className={styles.searchIcon}>&#9989;</span>
              <span className={styles.searchText}>{uiConfig.searchAttack.found}</span>
              <span className={styles.matchInfo}>
                {uiConfig.common.currency} {matchedDefense.bet}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        className={styles.info}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}>&#128161;</span>
          <p>{uiConfig.searchAttack.infoMatch}</p>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}>&#9888;&#65039;</span>
          <p>{uiConfig.searchAttack.infoCharge}</p>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={searchState === 'confirming'}
        onClose={handleCloseConfirm}
        title={uiConfig.searchAttack.confirmTitle}
      >
        <div className={styles.confirmModal}>
          <p className={styles.confirmText}>
            {uiConfig.searchAttack.confirmText}
          </p>
          <p className={styles.confirmRange}>
            {uiConfig.searchAttack.confirmRange} <strong>{uiConfig.common.currency} {minBet} - {maxBet}</strong>
          </p>
          <div className={styles.confirmButtons}>
            <Button color="primary" size="lg" fullWidth onClick={handleConfirmSearch}>
              {uiConfig.searchAttack.confirm}
            </Button>
            <Button color="secondary" size="lg" fullWidth onClick={handleCloseConfirm}>
              {uiConfig.searchAttack.cancel}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SearchAttackPage;
