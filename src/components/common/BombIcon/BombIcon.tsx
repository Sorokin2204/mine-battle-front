import React from 'react';
import { uiConfig } from '@/config/ui.config';

interface BombIconProps {
  className?: string;
  size?: number | string;
}

const BombIcon: React.FC<BombIconProps> = ({ className, size = '1.2em' }) => (
  <img
    className={className}
    src={uiConfig.icons.bomb}
    alt={uiConfig.accessibility.bomb}
    draggable={false}
    style={{ width: size, height: size, objectFit: 'contain', verticalAlign: 'middle' }}
  />
);

export default BombIcon;
