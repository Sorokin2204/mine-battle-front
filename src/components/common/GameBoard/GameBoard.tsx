import React, { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, useDraggable, DragEndEvent, DragMoveEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import styles from './GameBoard.module.scss';
import { gameConfig as defaultGameConfig } from '@/config/game.config';
import Icon from '../Icon/Icon';

interface GameBoardProps {
  mode: 'setup' | 'play' | 'view';
  selectedBombs?: number[];
  revealedCells?: number[];
  bombPositions?: number[];
  foundBombPositions?: number[];
  onCellClick?: (position: number) => void;
  scannerPositions?: number[];
  scannerResult?: number;
  radarResult?: { type: 'row' | 'column'; index: number; bombCount: number } | null;
  disabled?: boolean;
  activeTool?: 'click' | 'scanner' | 'radar' | null;
  onScannerPlaced?: (positions: number[]) => void;
  onRadarPlaced?: (position: number) => void;
  fieldSize?: number;
}

// Draggable Scanner Overlay
interface DraggableScannerProps {
  fieldSize: number;
  currentRow: number;
  currentCol: number;
  cellSize: number;
  gridPadding: number;
  gap: number;
}

const DraggableScanner: React.FC<DraggableScannerProps> = ({ fieldSize, currentRow, currentCol, cellSize, gridPadding, gap }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'scanner-overlay',
  });

  const scannerSize = cellSize * 2 + gap;
  const left = gridPadding + currentCol * (cellSize + gap);
  const top = gridPadding + currentRow * (cellSize + gap);

  const style: React.CSSProperties = {
    position: 'absolute',
    width: scannerSize,
    height: scannerSize,
    left,
    top,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    zIndex: isDragging ? 100 : 10,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} className={clsx(styles.draggableScanner, { [styles['draggableScanner--dragging']]: isDragging })} {...listeners} {...attributes}>
      <span className={styles.scannerDragIcon}> {/* <img src="/radar3.png" /> */}</span>
      {/* <span className={styles.scannerDragText}>2×2</span> */}
    </div>
  );
};

// Draggable Radar Overlay
interface DraggableRadarProps {
  fieldSize: number;
  type: 'row' | 'column';
  index: number;
  cellSize: number;
  gridPadding: number;
  gap: number;
  gridSize: number;
}

const DraggableRadar: React.FC<DraggableRadarProps> = ({ fieldSize, type, index, cellSize, gridPadding, gap, gridSize }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'radar-overlay',
  });

  const isRow = type === 'row';
  const radarThickness = 32;

  let left: number, top: number, width: number, height: number;

  if (isRow) {
    left = 0;
    top = gridPadding + index * (cellSize + gap) + cellSize / 2 - radarThickness / 2;
    width = gridSize;
    height = radarThickness;
  } else {
    left = gridPadding + index * (cellSize + gap) + cellSize / 2 - radarThickness / 2;
    top = 0;
    width = radarThickness;
    height = gridSize;
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    width,
    height,
    left,
    top,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    zIndex: isDragging ? 100 : 10,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} className={clsx(styles.draggableRadar, styles[`draggableRadar--${type}`], { [styles['draggableRadar--dragging']]: isDragging })} {...listeners} {...attributes}>
      <span className={styles.radarDragIcon}>📡</span>
      <span className={styles.radarDragText}>{isRow ? '→' : '↓'}</span>
    </div>
  );
};

const GameBoard: React.FC<GameBoardProps> = ({
  mode,
  selectedBombs = [],
  revealedCells = [],
  bombPositions = [],
  foundBombPositions = [],
  onCellClick,
  scannerPositions = [],
  scannerResult,
  radarResult,
  disabled = false,
  activeTool = null,
  onScannerPlaced,
  onRadarPlaced,
  fieldSize: fieldSizeProp,
}) => {
  const fieldSize = fieldSizeProp ?? defaultGameConfig.fieldSize;
  const cells = Array.from({ length: fieldSize * fieldSize }, (_, i) => i);

  const gridRef = useRef<HTMLDivElement>(null);
  const [gridDimensions, setGridDimensions] = useState({ cellSize: 0, gridPadding: 12, gap: 8, gridSize: 0 });

  // Scanner drag state
  const [scannerDragPos, setScannerDragPos] = useState({ row: 0, col: 0 });

  // Radar drag state
  const [radarDragIndex, setRadarDragIndex] = useState(0);

  // Calculate grid dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const padding = 12; // matches $spacing-md
        const gap = 8;
        const availableSize = rect.width - padding * 2;
        const cellSize = (availableSize - gap * (fieldSize - 1)) / fieldSize;
        setGridDimensions({
          cellSize,
          gridPadding: padding,
          gap,
          gridSize: rect.width,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [fieldSize]);

  // Initialize scanner position when tool is activated
  useEffect(() => {
    if (activeTool === 'scanner' && !scannerPositions.length) {
      setScannerDragPos({ row: 0, col: 0 });
      // Notify parent of initial position
      const positions = [0, 1, fieldSize, fieldSize + 1];
      onScannerPlaced?.(positions);
    }
  }, [activeTool, fieldSize, onScannerPlaced, scannerPositions.length]);

  // Initialize radar position when tool is activated
  useEffect(() => {
    if (activeTool === 'radar' && !radarResult) {
      setRadarDragIndex(0);
      onRadarPlaced?.(0);
    }
  }, [activeTool, radarResult, onRadarPlaced]);

  const handleCellClick = (position: number) => {
    if (disabled) return;

    // For scanner/radar, clicking doesn't do anything - use drag instead
    if (activeTool === 'scanner' || activeTool === 'radar') {
      return;
    }

    onCellClick?.(position);
  };

  // Handle drag end for scanner
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;

      if (active.id === 'scanner-overlay') {
        const { cellSize, gap } = gridDimensions;
        const stepSize = cellSize + gap;

        // Calculate how many cells to move
        const colDelta = Math.round(delta.x / stepSize);
        const rowDelta = Math.round(delta.y / stepSize);

        // Calculate new position with bounds
        const newCol = Math.max(0, Math.min(fieldSize - 2, scannerDragPos.col + colDelta));
        const newRow = Math.max(0, Math.min(fieldSize - 2, scannerDragPos.row + rowDelta));

        setScannerDragPos({ row: newRow, col: newCol });

        // Calculate cell positions for 2x2 area
        const positions = [newRow * fieldSize + newCol, newRow * fieldSize + newCol + 1, (newRow + 1) * fieldSize + newCol, (newRow + 1) * fieldSize + newCol + 1];

        onScannerPlaced?.(positions);
      } else if (active.id === 'radar-overlay') {
        const { cellSize, gap } = gridDimensions;
        const stepSize = cellSize + gap;

        // Calculate movement based on radar type
        const isRow = radarResult?.type === 'row';
        const moveDelta = isRow ? delta.y : delta.x;
        const indexDelta = Math.round(moveDelta / stepSize);

        const newIndex = Math.max(0, Math.min(fieldSize - 1, radarDragIndex + indexDelta));

        setRadarDragIndex(newIndex);
        onRadarPlaced?.(newIndex);
      }
    },
    [gridDimensions, fieldSize, scannerDragPos, radarDragIndex, radarResult, onScannerPlaced, onRadarPlaced],
  );

  const getCellState = (position: number) => {
    const isSelected = selectedBombs.includes(position);
    const isRevealed = revealedCells.includes(position);
    const isFoundBomb = foundBombPositions.includes(position);
    const isBomb = bombPositions.includes(position) || isFoundBomb;
    const isInScanner = scannerPositions.includes(position);
    const isInRadar = radarResult && ((radarResult.type === 'row' && Math.floor(position / fieldSize) === radarResult.index) || (radarResult.type === 'column' && position % fieldSize === radarResult.index));

    return { isSelected, isRevealed, isBomb, isFoundBomb, isInScanner, isInRadar };
  };

  // Check if we're in drag mode for scanner/radar
  const showDraggableScanner = activeTool === 'scanner' && scannerPositions.length > 0 && (scannerResult === undefined || scannerResult < 0);
  const showDraggableRadar = activeTool === 'radar' && radarResult && radarResult.bombCount < 0;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className={styles.board}>
        <div
          ref={gridRef}
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${fieldSize}, 1fr)`,
            gridTemplateRows: `repeat(${fieldSize}, 1fr)`,
          }}>
          <AnimatePresence>
            {cells.map((position) => {
              const { isSelected, isRevealed, isBomb, isFoundBomb, isInScanner, isInRadar } = getCellState(position);

              return (
                <motion.button
                  key={position}
                  className={clsx(styles.cell, {
                    [styles['cell--selected']]: isSelected,
                    [styles['cell--revealed']]: isRevealed,
                    [styles['cell--bomb']]: isRevealed && isFoundBomb,
                    [styles['cell--safe']]: isRevealed && !isFoundBomb && !isBomb,
                    [styles['cell--scanner']]: isInScanner && !showDraggableScanner,
                    [styles['cell--radar']]: isInRadar && !showDraggableRadar,
                    [styles['cell--disabled']]: disabled,
                    [styles['cell--clickable']]: !disabled && mode !== 'view' && activeTool !== 'scanner' && activeTool !== 'radar',
                  })}
                  onClick={() => handleCellClick(position)}
                  disabled={disabled || mode === 'view'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: position * 0.02 }}
                  whileHover={!disabled && mode !== 'view' && !activeTool ? { scale: 1.05 } : {}}
                  whileTap={!disabled && mode !== 'view' && !activeTool ? { scale: 0.95 } : {}}>
                  {mode === 'setup' && isSelected && (
                    <motion.span className={styles.bombIcon} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      💣
                    </motion.span>
                  )}
                  {isRevealed && isFoundBomb && (
                    <motion.span className={styles.foundBombIcon} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}>
                      ✓
                    </motion.span>
                  )}
                  {isRevealed && !isFoundBomb && !isBomb && (
                    <motion.span className={styles.safeIcon} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Icon icon="close" />
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

          {/* Draggable Scanner */}
          {showDraggableScanner && gridDimensions.cellSize > 0 && <DraggableScanner fieldSize={fieldSize} currentRow={scannerDragPos.row} currentCol={scannerDragPos.col} cellSize={gridDimensions.cellSize} gridPadding={gridDimensions.gridPadding} gap={gridDimensions.gap} />}

          {/* Draggable Radar */}
          {showDraggableRadar && gridDimensions.cellSize > 0 && radarResult && (
            <DraggableRadar fieldSize={fieldSize} type={radarResult.type} index={radarDragIndex} cellSize={gridDimensions.cellSize} gridPadding={gridDimensions.gridPadding} gap={gridDimensions.gap} gridSize={gridDimensions.gridSize} />
          )}
        </div>

        {/* Scanner overlay result - only show count if not in preview mode */}
        {scannerPositions.length > 0 && scannerResult !== undefined && scannerResult >= 0 && (
          <div className={styles.scannerOverlay}>
            <span className={styles.scannerCount}>{scannerResult}</span>
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
      </div>
    </DndContext>
  );
};

export default GameBoard;
