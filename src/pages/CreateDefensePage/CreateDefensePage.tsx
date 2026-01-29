import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import styles from './CreateDefensePage.module.scss';
import Button from '@/components/common/Button';
import GameBoard from '@/components/common/GameBoard';
import { getConfigByDifficulty } from '@/config/game.config';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { toggleBombPosition, clearSelectedBombs, setCreatingDefense } from '@/redux/slices/game.slice';
import { showToast } from '@/redux/slices/ui.slice';
import { socketService } from '@/services/socket';
import { DifficultyLevel } from '@/types';
import { star } from '@/utils/icons';

interface DifficultyOption {
  level: DifficultyLevel;
  label: string;
  description: string;
}

const difficultyOptions: DifficultyOption[] = [
  { level: 'EASY', label: 'Легкий', description: '3×3, 1 бомба' },
  { level: 'MEDIUM', label: 'Средний', description: '4×4, 2 бомбы' },
  { level: 'HARD', label: 'Сложный', description: '5×5, 3 бомбы' },
];

const CreateDefensePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedBombs, isCreatingDefense } = useAppSelector((state) => state.game);
  const { user } = useAppSelector((state) => state.auth);

  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const difficultyOption = useMemo(() => {
    return difficultyOptions?.find((opt) => opt.level == difficulty);
  }, [difficulty, difficultyOptions]);
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

  const handleBetChange = (value: number) => {
    setBet(value);
    setInputValue(String(value));
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
    if (selectedBombs.length >= config.bombsCount && !selectedBombs.includes(position)) {
      return;
    }
    dispatch(toggleBombPosition(position));
  };

  const handleCreateDefense = async () => {
    if (selectedBombs.length !== config.bombsCount) {
      dispatch(showToast({ message: `Разместите ${config.bombsCount} ${config.bombsCount === 1 ? 'бомбу' : 'бомбы'}`, type: 'error' }));
      return;
    }

    if (!user || user.balance < bet) {
      dispatch(showToast({ message: 'Недостаточно средств', type: 'error' }));
      return;
    }

    if (bet < config.minBet || bet > config.maxBet) {
      dispatch(
        showToast({
          message: `Ставка должна быть от ${config.minBet} до ${config.maxBet}`,
          type: 'error',
        }),
      );
      return;
    }

    try {
      dispatch(setCreatingDefense(true));
      await socketService.createDefense(bet, selectedBombs, difficulty);
      dispatch(showToast({ message: 'Защита создана!', type: 'success' }));
      dispatch(clearSelectedBombs());
      navigate('/games');
    } catch (error: any) {
      dispatch(showToast({ message: error.message || 'Ошибка создания защиты', type: 'error' }));
    } finally {
      dispatch(setCreatingDefense(false));
    }
  };

  const canCreate = selectedBombs.length === config.bombsCount && bet >= config.minBet;

  return (
    <div className={styles.page}>
      <motion.div className={styles.header} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={styles.title}>Создание защиты</h1>
        {/* <p className={styles.subtitle}>Спрячь {config.bombsCount} {config.bombsCount === 1 ? 'бомбу' : 'бомбы'} на поле</p> */}
      </motion.div>
      <motion.div className={styles.betSection} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <label className={styles.label}>Ставка</label>
        <div className={styles.betInput}>
          <span className={styles.betIcon}>{star()}</span>
          <input type="text" value={inputValue} onChange={handleInputChange} onBlur={handleInputBlur} placeholder="Введите ставку" className={styles.input} />
        </div>
        <div className={styles.quickBets}>
          {config.quickBets.map((qBet) => (
            <button key={qBet} className={`${styles.quickBet} ${bet === qBet ? styles.active : ''}`} onClick={() => handleBetChange(qBet)}>
              {qBet}
            </button>
          ))}
        </div>
      </motion.div>
      <motion.div className={styles.difficultySection} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <div className={clsx(styles.difficultyContent)}>
          {' '}
          <label className={styles.label}>Сложность</label>
          <div className={styles.difficultyButtons}>
            {difficultyOptions.map((option) => (
              <button key={option.level} className={clsx(styles.difficultyBtn, styles[`difficultyBtn--${option.level.toLowerCase()}`], { [styles.active]: difficulty === option.level })} onClick={() => handleDifficultyChange(option.level)}>
                {/* <span className={styles.difficultyLabel}>{option.label}</span> */}
                {/* <span className={styles.difficultyDesc}>{option.description}</span> */}
              </button>
            ))}
          </div>
          <span className={clsx(styles.difficultyLabel, styles[`difficultyLabel--${difficultyOption?.level.toLowerCase()}`])}> {difficultyOption?.label}</span>
        </div>

        <div className={styles.difficultyStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Попытки</span>
            <span className={styles.statValue}>
              {config.attempts} <span className={styles.statIcon}>🎯</span>
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>радаров</span>

            <span className={styles.statValue}>
              {config.radars} <span className={styles.statIcon}>📡</span>
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>сканеров</span>

            <span className={styles.statValue}>
              {config.scanners} <span className={styles.statIcon}>🔍</span>
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div className={styles.boardSection} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
        <div className={styles.boardInfo}>
          <div className={clsx(styles.bombLabel)}> Разместите бомбы</div>
          <span className={styles.bombCount}>{config.bombsCount - selectedBombs.length} 💣</span>
        </div>
        <GameBoard mode="setup" selectedBombs={selectedBombs} onCellClick={handleCellClick} fieldSize={config.fieldSize} />
        {selectedBombs.length > 0 && (
          <button className={styles.clearBtn} onClick={() => dispatch(clearSelectedBombs())}>
            Очистить
          </button>
        )}
      </motion.div>

      <motion.div className={styles.footer} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Время жизни</span>
            <span>⏱️ 2 мин</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Выйгрыш</span>
            <span>
              {star(20)} {bet}
            </span>
          </div>
        </div>
        <Button color="primary" size="lg" fullWidth disabled={!canCreate} loading={isCreatingDefense} onClick={handleCreateDefense}>
          Создать за {star(20)} <span style={{ marginLeft: '-4px' }}>{bet}</span>
        </Button>
      </motion.div>
    </div>
  );
};

export default CreateDefensePage;
