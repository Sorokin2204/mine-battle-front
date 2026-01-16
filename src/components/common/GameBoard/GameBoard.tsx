import React, { useState } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './GameBoard.module.scss';
import { gameConfig } from '@/config/game.config';

interface GameBoardProps {
  mode: 'setup' | 'play' | 'view';
  selectedBombs?: number[];
  revealedCells?: number[];
  bombPositions?: number[];
  onCellClick?: (position: number) => void;
  scannerPositions?: number[];
  scannerResult?: number;
  radarResult?: { type: 'row' | 'column'; index: number; bombCount: number } | null;
  disabled?: boolean;
  activeTool?: 'click' | 'scanner' | 'radar' | null;
  onScannerPlaced?: (positions: number[]) => void;
  onRadarPlaced?: (position: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ mode, selectedBombs = [], revealedCells = [], bombPositions = [], onCellClick, scannerPositions = [], scannerResult, radarResult, disabled = false, activeTool = null, onScannerPlaced, onRadarPlaced }) => {
  console.log(disabled, 'disabled');

  const [scannerDragPos, setScannerDragPos] = useState<{ row: number; col: number } | null>(null);
  const [radarDragPos, setRadarDragPos] = useState<{ type: 'row' | 'column'; index: number } | null>(null);

  const { fieldSize } = gameConfig;
  const cells = Array.from({ length: fieldSize * fieldSize }, (_, i) => i);

  const handleCellClick = (position: number) => {
    if (disabled) return;

    if (activeTool === 'scanner') {
      const row = Math.floor(position / fieldSize);
      const col = position % fieldSize;

      // Calculate 2x2 area starting from this cell
      const maxRow = Math.min(row, fieldSize - 2);
      const maxCol = Math.min(col, fieldSize - 2);

      const positions = [maxRow * fieldSize + maxCol, maxRow * fieldSize + maxCol + 1, (maxRow + 1) * fieldSize + maxCol, (maxRow + 1) * fieldSize + maxCol + 1];

      onScannerPlaced?.(positions);
    } else if (activeTool === 'radar') {
      // For radar, position 0-3 = rows, 4-7 = columns
      const row = Math.floor(position / fieldSize);
      onRadarPlaced?.(row); // Default to row
    } else {
      onCellClick?.(position);
    }
  };

  const getCellState = (position: number) => {
    const isSelected = selectedBombs.includes(position);
    const isRevealed = revealedCells.includes(position);
    const isBomb = bombPositions.includes(position);
    const isInScanner = scannerPositions.includes(position);
    const isInRadar = radarResult && ((radarResult.type === 'row' && Math.floor(position / fieldSize) === radarResult.index) || (radarResult.type === 'column' && position % fieldSize === radarResult.index));

    return { isSelected, isRevealed, isBomb, isInScanner, isInRadar };
  };

  return (
    <div className={styles.board}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${fieldSize}, 1fr)`,
          gridTemplateRows: `repeat(${fieldSize}, 1fr)`,
        }}>
        <AnimatePresence>
          {cells.map((position) => {
            const { isSelected, isRevealed, isBomb, isInScanner, isInRadar } = getCellState(position);

            return (
              <motion.button
                key={position}
                className={clsx(styles.cell, {
                  [styles['cell--selected']]: isSelected,
                  [styles['cell--revealed']]: isRevealed,
                  [styles['cell--bomb']]: isRevealed && isBomb,
                  [styles['cell--safe']]: isRevealed && !isBomb,
                  [styles['cell--scanner']]: isInScanner,
                  [styles['cell--radar']]: isInRadar,
                  [styles['cell--disabled']]: disabled,
                  [styles['cell--clickable']]: !disabled && mode !== 'view',
                })}
                onClick={() => handleCellClick(position)}
                disabled={disabled || mode === 'view'}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: position * 0.02 }}
                whileHover={!disabled && mode !== 'view' ? { scale: 1.05 } : {}}
                whileTap={!disabled && mode !== 'view' ? { scale: 0.95 } : {}}>
                {mode === 'setup' && isSelected && (
                  <motion.span className={styles.bombIcon} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    💣
                  </motion.span>
                )}
                {isRevealed && isBomb && (
                  <motion.span className={styles.bombIcon} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}>
                    💣
                  </motion.span>
                )}
                {isRevealed && !isBomb && (
                  <motion.span className={styles.safeIcon} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    ✕
                  </motion.span>
                )}
                {mode === 'view' && !isRevealed && isBomb && (
                  <motion.span className={styles.hiddenBomb} initial={{ opacity: 0 }} animate={{ opacity: 0.3 }}>
                    💣
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Scanner overlay result - only show count if not in preview mode */}
      {scannerPositions.length > 0 && scannerResult !== undefined && scannerResult >= 0 && (
        <div className={styles.scannerOverlay}>
          <span className={styles.scannerCount}>{scannerResult}</span>
        </div>
      )}

      {/* Scanner preview overlay */}
      {scannerPositions.length > 0 && (scannerResult === undefined || scannerResult < 0) && (
        <div className={clsx(styles.scannerOverlay, styles['scannerOverlay--preview'])}>
          <span className={styles.scannerPreviewText}>2x2</span>
        </div>
      )}

      {/* Radar result - only show count if bombCount >= 0 (not preview) */}
      {radarResult && radarResult.bombCount >= 0 && (
        <div
          className={clsx(styles.radarOverlay, {
            [styles['radarOverlay--row']]: radarResult.type === 'row',
            [styles['radarOverlay--column']]: radarResult.type === 'column',
          })}
          style={{
            ...(radarResult.type === 'row' ? { top: `${(radarResult.index + 0.5) * (100 / fieldSize)}%` } : { left: `${(radarResult.index + 0.5) * (100 / fieldSize)}%` }),
          }}>
          <span className={styles.radarCount}>{radarResult.bombCount}</span>
        </div>
      )}

      {/* Radar preview */}
      {radarResult && radarResult.bombCount < 0 && (
        <div
          className={clsx(styles.radarOverlay, styles['radarOverlay--preview'], {
            [styles['radarOverlay--row']]: radarResult.type === 'row',
            [styles['radarOverlay--column']]: radarResult.type === 'column',
          })}
          style={{
            ...(radarResult.type === 'row' ? { top: `${(radarResult.index + 0.5) * (100 / fieldSize)}%` } : { left: `${(radarResult.index + 0.5) * (100 / fieldSize)}%` }),
          }}>
          <span className={styles.radarPreviewText}>{radarResult.type === 'row' ? '→' : '↓'}</span>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
