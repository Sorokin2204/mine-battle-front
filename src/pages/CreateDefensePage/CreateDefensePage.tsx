import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './CreateDefensePage.module.scss';
import Button from '@/components/common/Button';
import GameBoard from '@/components/common/GameBoard';
import { gameConfig } from '@/config/game.config';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import {
  toggleBombPosition,
  clearSelectedBombs,
  setCreatingDefense,
} from '@/redux/slices/game.slice';
import { showToast } from '@/redux/slices/ui.slice';
import { socketService } from '@/services/socket';

const CreateDefensePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedBombs, isCreatingDefense } = useAppSelector((state) => state.game);
  const { user } = useAppSelector((state) => state.auth);

  const [bet, setBet] = useState<number>(gameConfig.quickBets[0]);
  const [inputValue, setInputValue] = useState<string>(String(gameConfig.quickBets[0]));

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
    if (!inputValue || isNaN(numValue) || numValue < gameConfig.minBet) {
      setBet(gameConfig.minBet);
      setInputValue(String(gameConfig.minBet));
    } else {
      setBet(numValue);
      setInputValue(String(numValue));
    }
  };

  const handleCellClick = (position: number) => {
    dispatch(toggleBombPosition(position));
  };

  const handleCreateDefense = async () => {
    if (selectedBombs.length !== gameConfig.bombsCount) {
      dispatch(showToast({ message: `Разместите ${gameConfig.bombsCount} бомбы`, type: 'error' }));
      return;
    }

    if (!user || user.balance < bet) {
      dispatch(showToast({ message: 'Недостаточно средств', type: 'error' }));
      return;
    }

    if (bet < gameConfig.minBet || bet > gameConfig.maxBet) {
      dispatch(
        showToast({
          message: `Ставка должна быть от ${gameConfig.minBet} до ${gameConfig.maxBet}`,
          type: 'error',
        })
      );
      return;
    }

    try {
      dispatch(setCreatingDefense(true));
      await socketService.createDefense(bet, selectedBombs);
      dispatch(showToast({ message: 'Защита создана!', type: 'success' }));
      dispatch(clearSelectedBombs());
      navigate('/games');
    } catch (error: any) {
      dispatch(showToast({ message: error.message || 'Ошибка создания защиты', type: 'error' }));
    } finally {
      dispatch(setCreatingDefense(false));
    }
  };

  const canCreate = selectedBombs.length === gameConfig.bombsCount && bet >= gameConfig.minBet;

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={styles.title}>Создание защиты</h1>
        <p className={styles.subtitle}>Спрячь {gameConfig.bombsCount} бомбы на поле</p>
      </motion.div>

      <motion.div
        className={styles.betSection}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <label className={styles.label}>Ставка</label>
        <div className={styles.betInput}>
          <span className={styles.betIcon}>⭐</span>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="Введите ставку"
            className={styles.input}
          />
        </div>
        <div className={styles.quickBets}>
          {gameConfig.quickBets.map((qBet) => (
            <button
              key={qBet}
              className={`${styles.quickBet} ${bet === qBet ? styles.active : ''}`}
              onClick={() => handleBetChange(qBet)}
            >
              {qBet}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        className={styles.boardSection}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className={styles.boardInfo}>
          <span className={styles.bombCount}>
            💣 {selectedBombs.length}/{gameConfig.bombsCount}
          </span>
          {selectedBombs.length > 0 && (
            <button
              className={styles.clearBtn}
              onClick={() => dispatch(clearSelectedBombs())}
            >
              Очистить
            </button>
          )}
        </div>
        <GameBoard
          mode="setup"
          selectedBombs={selectedBombs}
          onCellClick={handleCellClick}
        />
      </motion.div>

      <motion.div
        className={styles.footer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Ставка:</span>
            <span>⭐ {bet}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Время жизни:</span>
            <span>1 час</span>
          </div>
        </div>
        <Button
          color="primary"
          size="lg"
          fullWidth
          disabled={!canCreate}
          loading={isCreatingDefense}
          onClick={handleCreateDefense}
        >
          Создать за ⭐ {bet}
        </Button>
      </motion.div>
    </div>
  );
};

export default CreateDefensePage;
