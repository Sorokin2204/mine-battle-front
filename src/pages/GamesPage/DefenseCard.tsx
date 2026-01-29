import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import styles from './DefenseCard.module.scss';
import Avatar from '@/components/common/Avatar';
import DifficultyIndicator from '@/components/common/DifficultyIndicator';
import { DefensePublic } from '@/types';
import { star } from '@/utils/icons';

interface DefenseCardProps {
  defense: DefensePublic;
  isOwn: boolean;
  onClick: () => void;
}

const DefenseCard: React.FC<DefenseCardProps> = ({ defense, isOwn, onClick }) => {
  const isWaiting = defense.status === 'WAITING';
  const isActive = defense.status === 'IN_PROGRESS';

  return (
    <div
      className={clsx(styles.card, {
        [styles['card--own']]: isOwn,
        [styles['card--active']]: isActive,
      })}
      onClick={onClick}>
      <div className={styles.header}>
        <Avatar src={defense.creator.photoUrl} name={defense.creator.firstName || defense.creator.username} size="sm" />
        <div className={styles.difficultyLevel}>
          {' '}
          <DifficultyIndicator difficulty={defense.difficulty} />
        </div>
      </div>

      <div className={styles.body}>
        <div className={clsx(styles.bodyLeft)}>
          <span className={styles.betLabel}>Ставка</span>
          <div className={styles.betRow}>
            {star(16)}
            <span className={styles.betAmount}>{defense.bet}</span>
          </div>
        </div>
        <div className={clsx(styles.bodyRight)}>
          {' '}
          {isWaiting && !isActive && (
            <motion.div className={styles.actionIcon} animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <div className={styles.swordCircle}>&#9876;&#65039;</div>
            </motion.div>
          )}
          {isActive && (
            <motion.div className={styles.checkCircle} animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
              &#10004;
            </motion.div>
          )}
        </div>

        {/* {isWaiting && <span className={styles.multiplier}>x1.9</span>} */}
      </div>

      <div className={styles.footer}></div>
    </div>
  );
};

export default DefenseCard;
