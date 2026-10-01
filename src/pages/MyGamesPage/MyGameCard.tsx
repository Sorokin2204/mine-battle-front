import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './MyGameCard.module.scss';
import Avatar from '@/components/common/Avatar';
import { DefensePublic } from '@/types';
import { formatTime } from '@/utils/formatTime';
import { star } from '@/utils/icons';

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
  const [gameTime, setGameTime] = useState('');

  const eventTime = isFinished && defense.finishedAt ? defense.finishedAt : isExpired ? defense.expiresAt : defense.createdAt;

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const eventDate = new Date(eventTime);
      const isToday =
        eventDate.getDate() === now.getDate() &&
        eventDate.getMonth() === now.getMonth() &&
        eventDate.getFullYear() === now.getFullYear();

      if (isToday) {
        const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - eventDate.getTime()) / 1000));

        if (elapsedSeconds < 60) {
          setGameTime(`${elapsedSeconds}с назад`);
        } else if (elapsedSeconds < 3600) {
          setGameTime(`${Math.floor(elapsedSeconds / 60)}м назад`);
        } else {
          setGameTime(`${Math.floor(elapsedSeconds / 3600)}ч назад`);
        }
      } else {
        setGameTime(formatTime(eventTime));
      }

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

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [defense.expiresAt, defense.moveDeadline, defense.status, eventTime, isExpired]);

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

  const result = getResultInfo();
  const isActiveDefense = !result && isCreator;
  const isActiveAttack = !result && isAttacker && !isCreator;

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
        [styles['card--defense']]: isActiveDefense,
        [styles['card--attack']]: isActiveAttack,
      })}
      onClick={onClick}>
      <div className={styles.left}>
        <div className={styles.avatarColumn}>
          {opponent ? <Avatar src={opponent.photoUrl} name={opponent.firstName || opponent.username} size="md" /> : <div className={styles.emptyAvatar}>?</div>}
          {gameTime && (
            <time className={styles.finishedTime} dateTime={eventTime}>
              {gameTime}
            </time>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {result && (
          <>
            <div className={styles.center}>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>{result.label}</span>
                <span className={clsx(styles.resultAmount, styles[`resultAmount--${result.variant}`])}>
                  {result.variant === 'win' ? '+' : result.variant === 'refund' ? '+' : '-'}
                  {result.amount}
                  {star(18)}
                </span>
              </div>
            </div>
            <div className={styles.resultIcon}>
              {result.variant === 'win' && (
                <span className={styles.trophy}>
                  <img src="/win.png" width="24px" />
                </span>
              )}
              {result.variant === 'lose' && (
                <span className={styles.defeat}>
                  {' '}
                  <img src="/down.png" width="24px" />
                </span>
              )}
              {result.variant === 'refund' && <span className={styles.refund}>&#8634;</span>}
            </div>
          </>
        )}

        {!result && (
          <>
            <span className={clsx(styles.timer, isActiveAttack ? styles['timer--attack'] : styles['timer--defense'])}>
              {timeLeft || '00:00'}
            </span>
            <div className={styles.center}>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>
                  {defense.status === 'IN_PROGRESS' ? 'Идет атака' : 'Ожидание атаки'}
                </span>
                <span className={styles.betAmount}>
                  {defense.bet}
                  {star(18)}
                </span>
              </div>
            </div>
            <div className={styles.resultIcon}>
              <span className={styles.actionIcon} aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                  <path d="M0 0h24v24H0z" fill="none" />
                  <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 6l6 6l-6 6" />
                </svg>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyGameCard;
