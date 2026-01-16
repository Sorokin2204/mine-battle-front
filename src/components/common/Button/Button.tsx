import React from 'react';
import clsx from 'clsx';
import styles from './Button.module.scss';

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ButtonColor = 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize;
  color?: ButtonColor;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  color = 'primary',
  icon,
  iconOnly = false,
  fullWidth = false,
  loading = false,
  disabled,
  className,
  ...props
}) => {
  return (
    <button
      className={clsx(
        styles.btn,
        styles[`btn--${size}`],
        styles[`btn--${color}`],
        {
          [styles['btn--iconOnly']]: iconOnly,
          [styles['btn--fullWidth']]: fullWidth,
          [styles['btn--loading']]: loading,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner} />
      ) : (
        <>
          {icon && <span className={styles.icon}>{icon}</span>}
          {!iconOnly && children}
        </>
      )}
    </button>
  );
};

export default Button;
