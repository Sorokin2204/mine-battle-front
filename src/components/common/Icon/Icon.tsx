import styles from './Icon.module.scss';
import clsx from 'clsx';
import { useId } from 'react';

type Props = {
  icon: string;
  className?: string;
  size?: number;
  gradient?: {
    angle: number;
    stops: Array<{ offset: string; color: string }>;
  };
};

export default function Icon({ icon, className, size, gradient }: Props) {
  const gradientId = `icon-gradient-${useId().replace(/:/g, '')}`;

  return (
    <svg className={clsx(className, styles.icon)} {...(size && { width: `${size}px`, height: `${size}px` })}>
      {gradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0.5" x2="1" y2="0.5" gradientTransform={`rotate(${gradient.angle - 90} 0.5 0.5)`}>
            {gradient.stops.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>
      )}
      <use
        xlinkHref={`/bx-icons.svg#${icon}`}
        {...(gradient && { fill: `url(#${gradientId})`, stroke: `url(#${gradientId})` })}
      />
    </svg>
  );
}
