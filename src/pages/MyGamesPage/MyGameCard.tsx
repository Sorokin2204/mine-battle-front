import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import styles from './MyGameCard.module.scss';
import Avatar from '@/components/common/Avatar';
import DifficultyIndicator from '@/components/common/DifficultyIndicator';
import { DefensePublic } from '@/types';
import { formatRelativeTime } from '@/utils/formatTime';

interface MyGameCardProps {
  defense: DefensePublic;
  currentUserId?: number;
  onClick: () => void;
}

const MyGameCard: React.FC<MyGameCardProps> = ({ defense, currentUserId, onClick }) => {
  const isCreator = defense.creator.id === currentUserId;
  const isAttacker = defense.attacker?.id === currentUserId;
  const isWinner = defense.winnerId === currentUserId;
  const isFinished = defense.status === 'FINISHED';
  const isExpired = defense.status === 'EXPIRED' || (defense.status === 'WAITING' && new Date(defense.expiresAt).getTime() <= Date.now());

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTime = () => {
      let endTime: string | null = null;

      if (defense.status === 'WAITING' && !isExpired) {
        endTime = defense.expiresAt;
      } else if (defense.status === 'IN_PROGRESS' && defense.moveDeadline) {
        endTime = defense.moveDeadline;
      }

      if (endTime) {
        const diff = new Date(endTime).getTime() - Date.now();
        if (diff <= 0) {
          setTimeLeft('');
        } else {
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);

          if (hours > 0) {
            setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          } else {
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          }
        }
      } else {
        setTimeLeft('');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [defense, isExpired]);

  const getResultInfo = () => {
    // Expired defense - show refund
    if (isExpired && isCreator) {
      return { label: 'Возврат', variant: 'refund' as const, amount: defense.bet };
    }

    if (!isFinished) {
      return null;
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

    return null;
  };

  const getStatusInfo = () => {
    if (isExpired) {
      return null; // Don't show status for expired
    }
    if (defense.status === 'WAITING') {
      return { label: 'Ожидает', icon: '&#9203;', variant: 'waiting' as const };
    }
    if (defense.status === 'IN_PROGRESS') {
      return { label: 'В бою', icon: '&#9876;&#65039;', variant: 'active' as const };
    }
    return null;
  };

  const result = getResultInfo();
  const status = getStatusInfo();
  // For expired defenses, use expiresAt since finishedAt is null
  const finishedTime = isFinished
    ? formatRelativeTime(defense.finishedAt)
    : isExpired
      ? formatRelativeTime(defense.expiresAt)
      : null;

  const getOpponent = () => {
    if (isCreator && defense.attacker) {
      return defense.attacker;
    }
    if (isAttacker) {
      return defense.creator;
    }
    return null;
  };

  const opponent = getOpponent();

  return (
    <div
      className={clsx(styles.card, {
        [styles['card--win']]: result?.variant === 'win',
        [styles['card--lose']]: result?.variant === 'lose',
        [styles['card--refund']]: result?.variant === 'refund',
        [styles['card--waiting']]: status?.variant === 'waiting',
        [styles['card--active']]: status?.variant === 'active',
      })}
      onClick={onClick}>
      <div className={styles.left}>
        {opponent ? <Avatar src={opponent.photoUrl} name={opponent.firstName || opponent.username} size="md" /> : <div className={styles.emptyAvatar}>?</div>}
        <div className={styles.roleInfo}>
          <div className={styles.roleIcon}>
            {isCreator && <span>&#128737;&#65039;</span>}
            {isAttacker && !isCreator && <span>&#9876;&#65039;</span>}
          </div>
          <DifficultyIndicator difficulty={defense.difficulty} />
        </div>
      </div>

      <div className={styles.center}>
        {result ? (
          <div className={styles.resultRow}>
            <span className={styles.resultLabel}>{result.label}</span>
            <span className={clsx(styles.resultAmount, styles[`resultAmount--${result.variant}`])}>
              {result.variant === 'win' ? '+' : result.variant === 'refund' ? '+' : '-'}
              {result.amount}
              <span className={styles.star}>&#9733;</span>
            </span>
          </div>
        ) : (
          <div className={styles.betRow}>
            <span className={styles.betLabel}>Ставка</span>
            <span className={styles.betAmount}>
              <span className={styles.star}>&#9733;</span>
              {defense.bet}
            </span>
            {defense.status === 'WAITING' && !isExpired && <span className={styles.multiplier}>x1.9</span>}
          </div>
        )}
      </div>

      <div className={styles.right}>
        {result && (
          <>
            {finishedTime && <span className={styles.finishedTime}>{finishedTime}</span>}
            <div className={styles.resultIcon}>
              {result.variant === 'win' && <span className={styles.trophy}>&#127942;</span>}
              {result.variant === 'lose' && <span className={styles.defeat}>&#128546;</span>}
              {result.variant === 'refund' && <span className={styles.refund}>&#8634;</span>}
            </div>
          </>
        )}

        {status && (
          <div className={styles.statusInfo}>
            {defense.status === 'WAITING' && !defense.attacker && <motion.span className={styles.hourglassIcon} animate={{ rotateX: [0, 180, 360] }} transition={{ repeat: Infinity, duration: 2 }} dangerouslySetInnerHTML={{ __html: status.icon }} />}
            {defense.status === 'IN_PROGRESS' && <motion.span className={styles.swordIcon} animate={{ x: [0, 3, -3, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} dangerouslySetInnerHTML={{ __html: status.icon }} />}
            {timeLeft && <span className={styles.timeLeft}>{timeLeft}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGameCard;
