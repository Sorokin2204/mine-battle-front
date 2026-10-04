import React from 'react';
import clsx from 'clsx';
import styles from './DefenseCard.module.scss';
import Avatar from '@/components/common/Avatar';
import { DefensePublic } from '@/types';
import { star } from '@/utils/icons';
import { uiConfig } from '@/config/ui.config';

interface DefenseCardProps {
  defense: DefensePublic;
  isOwn: boolean;
  onClick: () => void;
}

const DefenseCard: React.FC<DefenseCardProps> = ({ defense, isOwn, onClick }) => {
  const creatorName = defense.creator.firstName || defense.creator.username || uiConfig.common.player;

  return (
    <div className={`${styles.card} ${styles[`card--${defense.difficulty.toLowerCase()}`]}`} onClick={onClick}>
      <div className={styles.left}>
        <div className={clsx(styles.avatarWrap, { [styles['avatarWrap--owner']]: isOwn })}>
          <Avatar src={defense.creator.photoUrl} name={creatorName} size="md" />
        </div>
        <div className={styles.creator}>
          <span className={styles.creatorName}>{creatorName}</span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>{uiConfig.common.bet}</span>
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
