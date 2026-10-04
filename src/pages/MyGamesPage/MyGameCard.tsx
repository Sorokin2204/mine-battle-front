import React, { useEffect, useState } from 'react';
import NumberFlow from '@number-flow/react';
import clsx from 'clsx';
import styles from './MyGameCard.module.scss';
import Avatar from '@/components/common/Avatar';
import { getConfigByDifficulty } from '@/config/game.config';
import { DefensePublic } from '@/types';
import { uiConfig } from '@/config/ui.config';
import { formatTime } from '@/utils/formatTime';
import { star } from '@/utils/icons';

interface MyGameCardProps {
  defense: DefensePublic;
  currentUserId?: number;
  onClick: () => void;
}

const calculateTimerFill = (defense: DefensePublic) => {
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

  return {
    progress: Math.min(100, Math.max(0, ((endTime - now) / (endTime - startTime)) * 100)),
    remaining: Math.max(0, endTime - now),
  };
};

const MyGameCard: React.FC<MyGameCardProps> = ({ defense, currentUserId, onClick }) => {
  const isCreator = defense.creator.id === currentUserId;
  const isAttacker = defense.attacker?.id === currentUserId;
  const isWinner = defense.winnerId === currentUserId;
  const isFinished = defense.status === 'FINISHED';
  const isExpired = defense.status === 'EXPIRED' || (defense.status === 'WAITING' && new Date(defense.expiresAt).getTime() <= Date.now());

  const [timeLeft, setTimeLeft] = useState(0);
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
          setGameTime(uiConfig.time.secondsAgo(elapsedSeconds));
        } else if (elapsedSeconds < 3600) {
          setGameTime(uiConfig.time.minutesAgo(Math.floor(elapsedSeconds / 60)));
        } else {
          setGameTime(uiConfig.time.hoursAgo(Math.floor(elapsedSeconds / 3600)));
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
        setTimeLeft(Math.max(0, diff));
      } else {
        setTimeLeft(0);
      }
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [defense.expiresAt, defense.moveDeadline, defense.status, eventTime, isExpired]);

  const getResultInfo = () => {
    // Expired defense - show refund
    if (isExpired && isCreator) {
      return { label: uiConfig.common.refund, variant: 'refund' as const, amount: defense.bet };
    }

    if (!isFinished) {
      return null;
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

    return null;
  };

  const result = getResultInfo();
  const isActiveDefense = !result && isCreator;
  const isActiveAttack = !result && isAttacker && !isCreator;
  const timerFill = calculateTimerFill(defense);
  const timerFillKey = defense.status === 'IN_PROGRESS' ? defense.moveDeadline : defense.expiresAt;
  const totalSecondsLeft = Math.ceil(timeLeft / 1000);
  const timerMinutes = Math.floor(totalSecondsLeft / 60);
  const timerSeconds = totalSecondsLeft % 60;

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
      {!result && (
        <span
          key={timerFillKey}
          className={styles.timerFill}
          style={
            {
              '--timer-progress': `${timerFill.progress}%`,
              '--timer-duration': `${timerFill.remaining}ms`,
            } as React.CSSProperties
          }
          aria-hidden="true"
        />
      )}
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
                  <img src={uiConfig.icons.win} width="24px" alt="" />
                </span>
              )}
              {result.variant === 'lose' && (
                <span className={styles.defeat}>
                  {' '}
                  <img src={uiConfig.icons.lose} width="24px" alt="" />
                </span>
              )}
              {result.variant === 'refund' && <span className={styles.refund}>&#8634;</span>}
            </div>
          </>
        )}

        {!result && (
          <>
            <span className={clsx(styles.timer, isActiveAttack ? styles['timer--attack'] : styles['timer--defense'])}>
              <NumberFlow value={timerMinutes} format={{ minimumIntegerDigits: 2 }} />
              <span className={styles.timerDivider}>:</span>
              <NumberFlow value={timerSeconds} format={{ minimumIntegerDigits: 2 }} />
            </span>
            <div className={styles.center}>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>
                  {isActiveDefense ? uiConfig.common.bet : defense.status === 'IN_PROGRESS' ? uiConfig.common.attackInProgress : uiConfig.common.waitingForAttack}
                </span>
                <span className={styles.betAmount}>
                  {defense.bet}
                  {star(18)}
                </span>
              </div>
            </div>
            <div className={styles.resultIcon}>
              <span className={styles.actionIcon} aria-hidden="true">
                {isActiveDefense ? (
                  <svg className={styles.hourglass} xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24">
                    <g fill="currentColor">
                      <path className={styles.hourglassTop} d="M7 3H17V7.2L12 12L7 7.2V3Z" />
                      <path className={styles.hourglassBottom} d="M17 21H7V16.8L12 12L17 16.8V21Z" />
                      <path d="M6 2V8H6.01L6 8.01L10 12L6 16L6.01 16.01H6V22H18V16.01H17.99L18 16L14 12L18 8.01L17.99 8H18V2H6ZM16 16.5V20H8V16.5L12 12.5L16 16.5ZM12 11.5L8 7.5V4H16V7.5L12 11.5Z" />
                    </g>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 6l6 6l-6 6" />
                  </svg>
                )}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyGameCard;
