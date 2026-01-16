import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.scss';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  variant = 'default',
  padding = 'md',
}) => {
  return (
    <div
      className={clsx(
        styles.card,
        styles[`card--${variant}`],
        styles[`card--padding-${padding}`],
        {
          [styles['card--clickable']]: !!onClick,
        },
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
