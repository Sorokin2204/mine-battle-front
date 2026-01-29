import React from 'react';
import styles from './Icon.module.scss';
import clsx from 'clsx';
type Props = {
  icon: string;
  className?: string;
  size?: number;
};

export default function Icon({ icon, className, size }: Props) {
  return (
    <svg className={clsx(className, styles.icon)} {...(size && { width: `${size}px`, height: `${size}px` })}>
      <use xlinkHref={`/bx-icons.svg#${icon}`}></use>
    </svg>
  );
}
