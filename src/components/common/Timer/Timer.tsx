import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './Timer.module.scss';
import NumberFlow from '@number-flow/react';

interface TimerProps {
  endTime: number;
  type?: 'countdown' | 'badge';
  variant?: 'default' | 'warning' | 'danger';
  prefix?: string;
  suffix?: string;
  onExpire?: () => void;
}

const Timer: React.FC<TimerProps> = ({ endTime, type = 'countdown', variant = 'default', prefix, suffix, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, endTime - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return (
      <>
        <div className={styles.timeBlock}>
          <NumberFlow value={minutes} format={{ minimumIntegerDigits: 2 }} />
        </div>
        <div className={clsx(styles.timeDivider)}>:</div>
        <div className={styles.timeBlock}>
          <NumberFlow value={parseInt(seconds.toString().padStart(2, '0'))} format={{ minimumIntegerDigits: 2 }} />
        </div>
        {/* `${minutes}м ${seconds.toString().padStart(2, '0')}с` */}
      </>
    );
    // if (minutes > 0) {
    // }
    // return (
    //   <>
    //     <NumberFlow value={seconds} format={{ minimumIntegerDigits: 2 }} />с
    //   </>
    // );
  };

  const getVariant = () => {
    if (variant !== 'default') return variant;
    if (timeLeft < 10000) return 'danger';
    if (timeLeft < 30000) return 'warning';
    return 'default';
  };

  return (
    <span className={clsx(styles.timer, styles[`timer--${type}`], styles[`timer--${getVariant()}`])}>
      {prefix}
      {formatTime(timeLeft)}
      {suffix}
    </span>
  );
};

export default Timer;
