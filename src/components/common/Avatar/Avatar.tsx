import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import styles from './Avatar.module.scss';
import { uiConfig } from '@/config/ui.config';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className }) => {
  const placeholderSrc = useMemo(() => {
    const seed = name || 'Mine Battle player';
    const avatarId = Array.from(seed).reduce((hash, char) => hash + char.charCodeAt(0), 0) % 70 + 1;

    return `https://i.pravatar.cc/150?img=${avatarId}`;
  }, [name]);
  const [imageSrc, setImageSrc] = useState(src || placeholderSrc);

  useEffect(() => {
    setImageSrc(src || placeholderSrc);
  }, [src, placeholderSrc]);

  return (
    <div className={clsx(styles.avatar, styles[`avatar--${size}`], className)}>
      <img
        src={imageSrc}
        alt={uiConfig.accessibility.avatar(name)}
        className={styles.image}
        onError={() => {
          if (imageSrc !== placeholderSrc) setImageSrc(placeholderSrc);
        }}
      />
    </div>
  );
};

export default Avatar;
