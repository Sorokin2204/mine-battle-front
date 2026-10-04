import React from 'react';
import clsx from 'clsx';
import styles from './DifficultyIndicator.module.scss';
import { DifficultyLevel } from '@/types';
import { uiConfig } from '@/config/ui.config';

interface DifficultyIndicatorProps {
  difficulty: DifficultyLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const DifficultyIndicator: React.FC<DifficultyIndicatorProps> = ({
  difficulty,
  showLabel = false,
  size = 'sm',
}) => {
  const barsCount = difficulty === 'EASY' ? 1 : difficulty === 'MEDIUM' ? 2 : 3;

  return (
    <div className={clsx(styles.indicator, styles[`indicator--${size}`])}>
      <div className={styles.bars}>
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={clsx(
              styles.bar,
              styles[`bar--${difficulty.toLowerCase()}`],
              { [styles['bar--active']]: bar <= barsCount }
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={clsx(styles.label, styles[`label--${difficulty.toLowerCase()}`])}>
          {uiConfig.difficulty[difficulty].label}
        </span>
      )}
    </div>
  );
};

export default DifficultyIndicator;
