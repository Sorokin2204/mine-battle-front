import React from 'react';
import clsx from 'clsx';
import styles from './DefenseCard.module.scss';
import Avatar from '@/components/common/Avatar';
import Icon from '@/components/common/Icon/Icon';
import { getConfigByDifficulty } from '@/config/game.config';
import { DefensePublic } from '@/types';
import { star } from '@/utils/icons';

const ownerIconGradient = {
  angle: 94.98,
  stops: [
    { offset: '10.08%', color: '#4762f2' },
    { offset: '94.83%', color: '#3dc5f0' },
  ],
};

interface DefenseCardProps {
  defense: DefensePublic;
  isOwn: boolean;
  onClick: () => void;
}

const calculateTimer = (defense: DefensePublic) => {
  const now = Date.now();
  let startTime: number | null = null;
  let endTime: number | null = null;

  if (defense.status === 'WAITING') {
    startTime = new Date(defense.createdAt).getTime();
    endTime = new Date(defense.expiresAt).getTime();
  } else if (defense.status === 'IN_PROGRESS' && defense.moveDeadline) {
    endTime = new Date(defense.moveDeadline).getTime();
    startTime = endTime - getConfigByDifficulty(defense.difficulty).moveTime;
  }

  if (startTime === null || endTime === null || endTime <= startTime) {
    return { progress: 0, remaining: 0 };
  }

  const progress = ((endTime - now) / (endTime - startTime)) * 100;
  return {
    progress: Math.min(100, Math.max(0, progress)),
    remaining: Math.max(0, endTime - now),
  };
};

const DefenseCard: React.FC<DefenseCardProps> = ({ defense, isOwn, onClick }) => {
  const timer = calculateTimer(defense);
  const timerKey = defense.status === 'IN_PROGRESS' ? defense.moveDeadline : defense.expiresAt;
  const creatorName = defense.creator.firstName || defense.creator.username || 'Игрок';

  return (
    <div className={`${styles.card} ${styles[`card--${defense.difficulty.toLowerCase()}`]}`} onClick={onClick}>
      <span
        key={timerKey}
        className={styles.timerFill}
        style={
          {
            '--timer-progress': `${timer.progress}%`,
            '--timer-duration': `${timer.remaining}ms`,
          } as React.CSSProperties
        }
        aria-hidden="true"
      />

      <div className={styles.left}>
        <div className={clsx(styles.avatarWrap, { [styles['avatarWrap--owner']]: isOwn })}>
          <Avatar src={defense.creator.photoUrl} name={creatorName} size="md" />
        </div>
        <div className={styles.creator}>
          <span className={styles.creatorName}>{creatorName}</span>
          {isOwn && <Icon icon="user" className={styles.ownerIcon} gradient={ownerIconGradient} />}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>Ставка</span>
          <span className={styles.resultAmount}>
            {defense.bet}
            {star(18)}
          </span>
        </div>

        <span className={styles.actionIcon} aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 6l6 6l-6 6" />
          </svg>
        </span>
      </div>
    </div>
  );
};

export default DefenseCard;
