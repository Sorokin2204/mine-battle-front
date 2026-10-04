import React from 'react';
import clsx from 'clsx';
import styles from './HistoryCard.module.scss';
import Avatar from '@/components/common/Avatar';
import { DefensePublic } from '@/types';
import { uiConfig } from '@/config/ui.config';
import { star } from '@/utils/icons';

interface HistoryCardProps {
  defense: DefensePublic;
  currentUserId?: number;
  onClick: () => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ defense, currentUserId, onClick }) => {
  const isCreator = currentUserId !== undefined && defense.creator.id === currentUserId;
  const isAttacker = currentUserId !== undefined && defense.attacker?.id === currentUserId;
  const isWinner = currentUserId !== undefined && defense.winnerId === currentUserId;

  const getResultInfo = () => {
    if (!currentUserId) {
      return { label: uiConfig.common.completed, variant: 'neutral' as const, amount: 0 };
    }

    if (defense.result === 'ATTACKER_TOOK_HALF') {
      if (isAttacker) {
        return { label: uiConfig.common.winnings, variant: 'win' as const, amount: Math.floor(defense.bet / 2) };
      }
      if (isCreator) {
        return { label: uiConfig.common.loss, variant: 'lose' as const, amount: Math.floor(defense.bet / 2) };
      }
    }

    if (isWinner) {
      return { label: uiConfig.common.winnings, variant: 'win' as const, amount: defense.bet };
    }

    if (isCreator || isAttacker) {
      return { label: uiConfig.common.loss, variant: 'lose' as const, amount: defense.bet };
    }

    return { label: uiConfig.common.completed, variant: 'neutral' as const, amount: 0 };
  };

  const result = getResultInfo();
  return (
    <div className={clsx(styles.card, styles[`card--${result.variant}`])} onClick={onClick}>
      <div className={styles.players}>
        <div className={styles.player}>
          <div className={clsx(styles.avatarWrap, { [styles['avatarWrap--defender']]: isCreator })}>
            <Avatar src={defense.creator.photoUrl} name={defense.creator.firstName || defense.creator.username} size="sm" />
          </div>
        </div>
        <div className={styles.vs}>VS</div>
        {/* <DifficultyIndicator difficulty={defense.difficulty} /> */}
        <div className={styles.player}>
          <div className={clsx(styles.avatarWrap, { [styles['avatarWrap--attacker']]: isAttacker })}>
            <Avatar src={defense.attacker?.photoUrl} name={defense.attacker?.firstName || defense.attacker?.username} size="sm" />
          </div>
        </div>
      </div>

      <div className={styles.info}>
        <div className={styles.betRow}>
          <span className={styles.betLabel}>{result.variant === 'neutral' ? uiConfig.common.bet : result.label}</span>
          <span className={clsx(styles.betAmount, styles[`betAmount--${result.variant}`])}>
            {result.variant === 'win' && '+'}
            {result.variant === 'lose' && '-'}
            {result.variant === 'neutral' ? defense.bet : result.amount}
            <span className={styles.star}>{star(18)}</span>
          </span>
        </div>
        {/* {finishedTime && <span className={styles.finishedTime}>{finishedTime}</span>} */}
        <div className={styles.resultIcon}>
          {result.variant === 'win' && (
            <span className={styles.trophy}>
              <img src={uiConfig.icons.win} width="24px" alt="" />
              {/* <img src="/trophy.png" width="24px" /> */}
            </span>
          )}
          {result.variant === 'lose' && (
            <span className={styles.defeat}>
              <img src={uiConfig.icons.lose} width="24px" alt="" />
            </span>
          )}
          {result.variant === 'neutral' && (
            <span className={styles.check} aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12.5L9.25 16.5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryCard;
