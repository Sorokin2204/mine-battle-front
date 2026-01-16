import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ResultModal.module.scss';
import Button from '@/components/common/Button';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { closeResultModal } from '@/redux/slices/ui.slice';

const ResultModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOpen, type, amount } = useAppSelector((state) => state.ui.resultModal);

  const handleClose = () => {
    dispatch(closeResultModal());
  };

  const getContent = () => {
    switch (type) {
      case 'win':
        return {
          emoji: '🤑',
          title: 'Вы победили',
          subtitle: 'Поздравляем!',
          color: 'success' as const,
        };
      case 'lose':
        return {
          emoji: '😔',
          title: 'В этот раз не повезло',
          subtitle: 'Попробуйте еще раз',
          color: 'error' as const,
        };
      case 'half':
        return {
          emoji: '🙂',
          title: 'Вы обезвредили 1 бомбу',
          subtitle: 'И забрали половину ставки',
          color: 'warning' as const,
        };
      default:
        return null;
    }
  };

  const content = getContent();

  if (!content) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <motion.div
              className={styles.emoji}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
            >
              {content.emoji}
            </motion.div>

            <h2 className={styles.title}>{content.title}</h2>
            <p className={styles.subtitle}>{content.subtitle}</p>

            {type !== 'lose' && (
              <motion.div
                className={styles.reward}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className={styles.rewardLabel}>Выигрыш</span>
                <span className={styles.rewardAmount}>
                  +{amount} <span className={styles.star}>⭐</span>
                </span>
              </motion.div>
            )}

            <motion.div
              className={styles.actions}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                color={content.color}
                size="lg"
                fullWidth
                onClick={handleClose}
              >
                {type === 'lose' ? 'Закрыть' : 'Забрать'}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ResultModal;
