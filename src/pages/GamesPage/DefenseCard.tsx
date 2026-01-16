import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import styles from './DefenseCard.module.scss';
import Avatar from '@/components/common/Avatar';
import { DefensePublic } from '@/types';

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
      onClick={onClick}
    >
      <div className={styles.header}>
        <Avatar
          src={defense.creator.photoUrl}
          name={defense.creator.firstName || defense.creator.username}
          size="sm"
        />
        <div className={styles.roleIcon}>&#128737;&#65039;</div>
      </div>

      <div className={styles.body}>
        <span className={styles.betLabel}>Ставка</span>
        <div className={styles.betRow}>
          <span className={styles.star}>&#9733;</span>
          <span className={styles.betAmount}>{defense.bet}</span>
        </div>
        {isWaiting && <span className={styles.multiplier}>x1.9</span>}
      </div>

      <div className={styles.footer}>
        {isWaiting && !isActive && (
          <motion.div
            className={styles.actionIcon}
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <div className={styles.swordCircle}>&#9876;&#65039;</div>
          </motion.div>
        )}
        {isActive && (
          <motion.div
            className={styles.checkCircle}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            &#10004;
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DefenseCard;
