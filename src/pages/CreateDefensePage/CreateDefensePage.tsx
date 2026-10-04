import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import styles from './CreateDefensePage.module.scss';
import Button from '@/components/common/Button';
import GameBoard from '@/components/common/GameBoard';
import { getConfigByDifficulty } from '@/config/game.config';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { setSelectedBombs, clearSelectedBombs, setCreatingDefense } from '@/redux/slices/game.slice';
import { showToast } from '@/redux/slices/ui.slice';
import { socketService } from '@/services/socket';
import { DifficultyLevel } from '@/types';
import { star } from '@/utils/icons';
import BombIcon from '@/components/common/BombIcon';
import { uiConfig } from '@/config/ui.config';

interface DifficultyOption {
  level: DifficultyLevel;
  label: string;
  description: string;
}

const difficultyOptions: DifficultyOption[] = [
  { level: 'EASY', ...uiConfig.difficulty.EASY },
  { level: 'MEDIUM', ...uiConfig.difficulty.MEDIUM },
  { level: 'HARD', ...uiConfig.difficulty.HARD },
];

const getRandomBombPositions = (fieldSize: number, bombsCount: number): number[] => {
  const availablePositions = Array.from({ length: fieldSize * fieldSize }, (_, position) => position);

  for (let index = 0; index < bombsCount; index += 1) {
    const randomIndex = index + Math.floor(Math.random() * (availablePositions.length - index));
    [availablePositions[index], availablePositions[randomIndex]] = [availablePositions[randomIndex], availablePositions[index]];
  }

  return availablePositions.slice(0, bombsCount);
};

const CreateDefensePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedBombs, isCreatingDefense } = useAppSelector((state) => state.game);
  const { user } = useAppSelector((state) => state.auth);

  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const config = getConfigByDifficulty(difficulty);

  const [bet, setBet] = useState<number>(config.quickBets[0]);
  const [inputValue, setInputValue] = useState<string>(String(config.quickBets[0]));

  // Clear bombs when difficulty changes
  useEffect(() => {
    dispatch(clearSelectedBombs());
  }, [difficulty, dispatch]);

  const handleDifficultyChange = (newDifficulty: DifficultyLevel) => {
    setDifficulty(newDifficulty);
  };

  const setBetValue = (value: number) => {
    setBet(value);
    setInputValue(String(value));
  };

  const getDisplayedBet = () => {
    const parsedValue = parseInt(inputValue, 10);
    return Number.isNaN(parsedValue) ? bet : parsedValue;
  };

  const increaseBet = (amount: number) => {
    setBetValue(Math.min(getDisplayedBet() + amount, config.maxBet));
  };

  const doubleBet = () => {
    setBetValue(Math.min(getDisplayedBet() * 2, config.maxBet));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setInputValue(value);
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue, 10);
    if (!inputValue || isNaN(numValue) || numValue < config.minBet) {
      setBet(config.minBet);
      setInputValue(String(config.minBet));
    } else {
      setBet(numValue);
      setInputValue(String(numValue));
    }
  };

  const handleCellClick = (position: number) => {
    if (selectedBombs.includes(position)) {
      dispatch(setSelectedBombs(selectedBombs.filter((bombPosition) => bombPosition !== position)));
      return;
    }

    if (selectedBombs.length < config.bombsCount) {
      dispatch(setSelectedBombs([...selectedBombs, position]));
      return;
    }

    dispatch(setSelectedBombs([...selectedBombs.slice(1), position]));
  };

  const handleCreateDefense = async (bombPositions: number[]) => {
    if (bombPositions.length !== config.bombsCount) {
      dispatch(showToast({ message: uiConfig.createDefense.placeBombsError(config.bombsCount), type: 'error' }));
      return;
    }

    if (!user || user.balance < bet) {
      dispatch(showToast({ message: uiConfig.createDefense.insufficientFunds, type: 'error' }));
      return;
    }

    if (bet < config.minBet || bet > config.maxBet) {
      dispatch(
        showToast({
          message: uiConfig.createDefense.betRangeError(config.minBet, config.maxBet),
          type: 'error',
        }),
      );
      return;
    }

    try {
      dispatch(setCreatingDefense(true));
      await socketService.createDefense(bet, bombPositions, difficulty);
      dispatch(showToast({ message: uiConfig.createDefense.created, type: 'success' }));
      dispatch(clearSelectedBombs());
      navigate('/my-games?tab=defenses');
    } catch (error: any) {
      dispatch(showToast({ message: error.message || uiConfig.createDefense.createError, type: 'error' }));
    } finally {
      dispatch(setCreatingDefense(false));
    }
  };

  const handleCreateRandomDefense = () => {
    const randomBombPositions = getRandomBombPositions(config.fieldSize, config.bombsCount);
    void handleCreateDefense(randomBombPositions);
  };

  const canCreate = selectedBombs.length === config.bombsCount && bet >= config.minBet;

  return (
    <div className={styles.page}>
      <motion.div className={styles.header} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={styles.title}>{uiConfig.createDefense.title}</h1>
      </motion.div>

      <motion.div className={styles.difficultySection} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className={clsx(styles.difficultyContent)}>
          <div className={styles.label}>{uiConfig.createDefense.difficulty}</div>
          <div className={styles.difficultyButtons}>
            {difficultyOptions.map((option) => (
              <button type="button" key={option.level} className={clsx(styles.difficultyBtn, styles[`difficultyBtn--${option.level.toLowerCase()}`], { [styles.active]: difficulty === option.level })} onClick={() => handleDifficultyChange(option.level)}>
                <span className={styles.difficultyLabel}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.difficultyStats}>
          <div className={styles.statItem} aria-label={`${uiConfig.createDefense.attempts}: ${config.attempts}`} title={uiConfig.createDefense.attempts}>
            <span className={styles.statLabel}>{uiConfig.createDefense.attempts}</span>
            <span className={styles.statValue}>
              {config.attempts} <img className={styles.statIcon} src={uiConfig.icons.attempt} alt="" />
            </span>
          </div>
          <div className={styles.statItem} aria-label={`${uiConfig.createDefense.radars}: ${config.radars}`} title={uiConfig.createDefense.radars}>
            <span className={styles.statLabel}>{uiConfig.createDefense.radars}</span>
            <span className={styles.statValue}>
              {config.radars} <img className={styles.statIcon} src={uiConfig.icons.radar} alt="" />
            </span>
          </div>
          <div className={styles.statItem} aria-label={`${uiConfig.createDefense.scanners}: ${config.scanners}`} title={uiConfig.createDefense.scanners}>
            <span className={styles.statLabel}>{uiConfig.createDefense.scanners}</span>
            <span className={styles.statValue}>
              {config.scanners} <img className={styles.statIcon} src={uiConfig.icons.scanner} alt="" />
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div className={styles.betSection} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <label className={styles.label} htmlFor="defense-bet">
          {uiConfig.createDefense.bet}
        </label>
        <div className={styles.betInput}>
          <span className={styles.betIcon}>{star()}</span>
          <input id="defense-bet" type="text" inputMode="numeric" value={inputValue} onChange={handleInputChange} onBlur={handleInputBlur} placeholder={uiConfig.createDefense.betPlaceholder} className={styles.input} />
        </div>
        <div className={styles.quickBets}>
          <button type="button" className={styles.quickBet} onClick={() => increaseBet(10)}>
            +10
          </button>
          <button type="button" className={styles.quickBet} onClick={() => increaseBet(100)}>
            +100
          </button>
          <button type="button" className={styles.quickBet} onClick={() => increaseBet(1000)}>
            +1000
          </button>
          <button type="button" className={styles.quickBet} onClick={doubleBet}>
            ×2
          </button>
        </div>
      </motion.div>

      <motion.div className={styles.boardSection} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
        <div className={styles.boardInfo}>
          <div className={styles.bombLabel}>{uiConfig.createDefense.placeBombs}</div>
          <span className={styles.bombCount}>
            {config.bombsCount - selectedBombs.length}
            <BombIcon />
          </span>
        </div>
        <GameBoard mode="setup" selectedBombs={selectedBombs} onCellClick={handleCellClick} fieldSize={config.fieldSize} />
      </motion.div>

      <motion.div className={styles.footer} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {import.meta.env.DEV && (
          <Button color="secondary" size="lg" fullWidth disabled={bet < config.minBet || bet > config.maxBet} loading={isCreatingDefense} onClick={handleCreateRandomDefense}>
            {uiConfig.createDefense.createRandom}
          </Button>
        )}
        <Button color="primary" size="lg" fullWidth disabled={!canCreate} loading={isCreatingDefense} onClick={() => void handleCreateDefense(selectedBombs)}>
          {uiConfig.createDefense.create}
        </Button>
      </motion.div>
    </div>
  );
};

export default CreateDefensePage;
