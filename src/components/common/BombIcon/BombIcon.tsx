import React from 'react';
import { BOMB_IMAGE_SRC } from '@/config/assets.config';

interface BombIconProps {
  className?: string;
  size?: number | string;
}

const BombIcon: React.FC<BombIconProps> = ({ className, size = '1.2em' }) => (
  <img
    className={className}
    src={BOMB_IMAGE_SRC}
    alt="Бомба"
    draggable={false}
    style={{ width: size, height: size, objectFit: 'contain', verticalAlign: 'middle' }}
  />
);

export default BombIcon;
