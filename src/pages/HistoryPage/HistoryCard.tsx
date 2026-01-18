import React from 'react';
import clsx from 'clsx';
import styles from './HistoryCard.module.scss';
import Avatar from '@/components/common/Avatar';
import DifficultyIndicator from '@/components/common/DifficultyIndicator';
import { DefensePublic } from '@/types';
import { formatRelativeTime } from '@/utils/formatTime';

interface HistoryCardProps {
  defense: DefensePublic;
  currentUserId?: number;
  onClick: () => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ defense, currentUserId, onClick }) => {
  const isCreator = defense.creator.id === currentUserId;
  const isAttacker = defense.attacker?.id === currentUserId;
  const isWinner = defense.winnerId === currentUserId;

  const getResultInfo = () => {
    if (!currentUserId) {
      return { label: 'Завершена', variant: 'neutral' as const, amount: 0 };
    }

    if (defense.result === 'ATTACKER_TOOK_HALF') {
      if (isAttacker) {
        return { label: 'Выигрыш', variant: 'win' as const, amount: Math.floor(defense.bet / 2) };
      }
      if (isCreator) {
        return { label: 'Проигрыш', variant: 'lose' as const, amount: Math.floor(defense.bet / 2) };
      }
    }

    if (isWinner) {
      return { label: 'Выигрыш', variant: 'win' as const, amount: defense.bet };
    }

    if (isCreator || isAttacker) {
      return { label: 'Проигрыш', variant: 'lose' as const, amount: defense.bet };
    }

    return { label: 'Завершена', variant: 'neutral' as const, amount: 0 };
  };

  const result = getResultInfo();
  const finishedTime = formatRelativeTime(defense.finishedAt);

  return (
    <div className={clsx(styles.card, styles[`card--${result.variant}`])} onClick={onClick}>
      <div className={styles.players}>
        <div className={styles.player}>
          <Avatar src={defense.creator.photoUrl} name={defense.creator.firstName || defense.creator.username} size="sm" />
          <span className={styles.role}>&#128737;&#65039;</span>
        </div>
        <DifficultyIndicator difficulty={defense.difficulty} />
        <div className={styles.player}>
          <Avatar src={defense.attacker?.photoUrl} name={defense.attacker?.firstName || defense.attacker?.username} size="sm" />
          <span className={styles.role}>&#9876;&#65039;</span>
        </div>
      </div>

      <div className={styles.info}>
        <div className={styles.betRow}>
          <span className={styles.betLabel}>{result.variant === 'neutral' ? 'Ставка' : result.label}</span>
          <span className={clsx(styles.betAmount, styles[`betAmount--${result.variant}`])}>
            {result.variant === 'win' && '+'}
            {result.variant === 'lose' && '-'}
            {result.variant === 'neutral' ? defense.bet : result.amount}
            <span className={styles.star}>&#9733;</span>
          </span>
        </div>
        {finishedTime && <span className={styles.finishedTime}>{finishedTime}</span>}
        <div className={styles.resultIcon}>
          {result.variant === 'win' && <span className={styles.trophy}>&#127942;</span>}
          {result.variant === 'lose' && <span className={styles.defeat}>&#128546;</span>}
          {result.variant === 'neutral' && <span className={styles.check}>&#9989;</span>}
        </div>
      </div>
    </div>
  );
};

export default HistoryCard;
