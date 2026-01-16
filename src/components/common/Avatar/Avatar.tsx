import React from 'react';
import clsx from 'clsx';
import styles from './Avatar.module.scss';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className }) => {
  const getInitials = () => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={clsx(styles.avatar, styles[`avatar--${size}`], className)}>
      {src ? (
        <img src={src} alt={name || 'Avatar'} className={styles.image} />
      ) : (
        <span className={styles.initials}>{getInitials()}</span>
      )}
    </div>
  );
};

export default Avatar;
