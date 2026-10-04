import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import styles from './GameBoard.module.scss';
import { gameConfig as defaultGameConfig } from '@/config/game.config';
import type { RadarResult, ScannerResult } from '@/types';
import BombIcon from '../BombIcon';
import { uiConfig } from '@/config/ui.config';

interface GameBoardProps {
  mode: 'setup' | 'play' | 'view';
  selectedBombs?: number[];
  revealedCells?: number[];
  bombPositions?: number[];
  foundBombPositions?: number[];
  onCellClick?: (position: number) => void;
  attemptPosition?: number | null;
  scannerPositions?: number[];
  scannerResult?: number;
  scannerResults?: ScannerResult[];
  radarResult?: { type: 'row' | 'column'; index: number; bombCount: number } | null;
  radarResults?: RadarResult[];
  disabled?: boolean;
  completed?: boolean;
  revealFinishedBombs?: boolean;
  activeTool?: 'click' | 'scanner' | 'radar' | null;
  onScannerPlaced?: (positions: number[]) => void;
  onRadarPlaced?: (position: number) => void;
  onAttemptPlaced?: (position: number) => void;
  onScannerConfirmed?: () => void;
  onRadarConfirmed?: () => void;
  onAttemptConfirmed?: () => void;
  onRadarTypeToggle?: () => void;
  fieldSize?: number;
}

// Draggable Scanner Overlay
interface DraggableScannerProps {
  currentRow: number;
  currentCol: number;
  cellSize: number;
  gridPadding: number;
  gap: number;
  onDragStart: (clientX: number, clientY: number) => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onActivate?: () => void;
}

const usePointerDrag = (onDragStart: (clientX: number, clientY: number) => void, onDragMove: (clientX: number, clientY: number) => void, onActivate?: () => void) => {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const pointerStartRef = useRef({ clientX: 0, clientY: 0 });
  const wasDraggedRef = useRef(false);

  const finishDrag = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  return {
    isDragging,
    pointerHandlers: {
      onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        isDraggingRef.current = true;
        wasDraggedRef.current = false;
        pointerStartRef.current = { clientX: event.clientX, clientY: event.clientY };
        setIsDragging(true);
        onDragStart(event.clientX, event.clientY);
      },
      onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return;
        if (Math.hypot(event.clientX - pointerStartRef.current.clientX, event.clientY - pointerStartRef.current.clientY) >= 5) {
          wasDraggedRef.current = true;
        }
        onDragMove(event.clientX, event.clientY);
      },
      onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return;
        if (Math.hypot(event.clientX - pointerStartRef.current.clientX, event.clientY - pointerStartRef.current.clientY) >= 5) {
          wasDraggedRef.current = true;
        }
        onDragMove(event.clientX, event.clientY);
        event.currentTarget.releasePointerCapture(event.pointerId);
        finishDrag();
      },
      onPointerCancel: finishDrag,
      onLostPointerCapture: finishDrag,
      onClick: () => {
        if (!wasDraggedRef.current) onActivate?.();
      },
    },
    wasDraggedRef,
  };
};

const DraggableScanner: React.FC<DraggableScannerProps> = ({ currentRow, currentCol, cellSize, gridPadding, gap, onDragStart, onDragMove, onActivate }) => {
  const { isDragging, pointerHandlers } = usePointerDrag(onDragStart, onDragMove, onActivate);
  const animationControls = useAnimationControls();
  const hasAppeared = useRef(false);

  useEffect(() => {
    if (!hasAppeared.current) {
      hasAppeared.current = true;
      void animationControls.start({
        scale: [0, 1.04, 1],
        transition: { duration: 0.34, times: [0, 0.72, 1], ease: 'easeOut' },
      });
      return;
    }

    void animationControls.start({
      scale: [1, 0.9, 1],
      transition: { duration: 0.28, times: [0, 0.45, 1], ease: 'easeInOut' },
    });
  }, [animationControls, currentCol, currentRow]);

  const scannerSize = cellSize * 2 + gap;
  const left = gridPadding + currentCol * (cellSize + gap);
  const top = gridPadding + currentRow * (cellSize + gap);

  const style: React.CSSProperties = {
    position: 'absolute',
    width: scannerSize,
    height: scannerSize,
    left,
    top,
    zIndex: isDragging ? 100 : 10,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <motion.div style={style} className={styles.dragSurface} initial={false} exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.24, ease: 'easeInOut' }} {...pointerHandlers}>
      <motion.div className={clsx(styles.draggableScanner, { [styles['draggableScanner--dragging']]: isDragging })} initial={{ scale: 0 }} animate={animationControls}>
        <span className={styles.scannerDragIcon}>
          <img src={uiConfig.icons.radar} alt="" draggable={false} />
        </span>
      </motion.div>
    </motion.div>
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
  onTypeToggle?: () => void;
  onDragStart: (clientX: number, clientY: number) => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onActivate?: () => void;
}

const DraggableRadar: React.FC<DraggableRadarProps> = ({ fieldSize, type, index, cellSize, gridPadding, gap, onTypeToggle, onDragStart, onDragMove, onActivate }) => {
  const { isDragging, pointerHandlers } = usePointerDrag(onDragStart, onDragMove, onActivate);
  const animationControls = useAnimationControls();
  const hasAppeared = useRef(false);

  useEffect(() => {
    if (!hasAppeared.current) {
      hasAppeared.current = true;
      void animationControls.start({
        scale: [0, 1.04, 1],
        transition: { duration: 0.34, times: [0, 0.72, 1], ease: 'easeOut' },
      });
      return;
    }

    void animationControls.start({
      scale: [1, 0.9, 1],
      transition: { duration: 0.28, times: [0, 0.45, 1], ease: 'easeInOut' },
    });
  }, [animationControls, index, type]);

  const isRow = type === 'row';
  const lineLength = cellSize * fieldSize + gap * (fieldSize - 1);

  let left: number, top: number, width: number, height: number;

  if (isRow) {
    left = gridPadding;
    top = gridPadding + index * (cellSize + gap);
    width = lineLength;
    height = cellSize;
  } else {
    left = gridPadding + index * (cellSize + gap);
    top = gridPadding;
    width = cellSize;
    height = lineLength;
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    width,
    height,
    left,
    top,
    zIndex: isDragging ? 100 : 10,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <motion.div style={style} className={styles.dragSurface} initial={false} exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.24, ease: 'easeInOut' }} {...pointerHandlers}>
      <motion.div className={clsx(styles.draggableRadar, styles[`draggableRadar--${type}`], { [styles['draggableRadar--dragging']]: isDragging })} initial={{ scale: 0 }} animate={animationControls}>
        <button
          type="button"
          className={styles.radarSwitch}
          aria-label={isRow ? uiConfig.board.radarToColumn : uiConfig.board.radarToRow}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onTypeToggle?.();
          }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.651 7.65a7.131 7.131 0 0 0-12.68 3.15M18.001 4v4h-4m-7.652 8.35a7.13 7.13 0 0 0 12.68-3.15M6 20v-4h4" />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  );
};

interface DraggableAttemptProps {
  position: number;
  fieldSize: number;
  cellSize: number;
  gridPadding: number;
  gap: number;
  onDragStart: (clientX: number, clientY: number) => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onActivate?: () => void;
}

const DraggableAttempt: React.FC<DraggableAttemptProps> = ({ position, fieldSize, cellSize, gridPadding, gap, onDragStart, onDragMove, onActivate }) => {
  const { isDragging, pointerHandlers } = usePointerDrag(onDragStart, onDragMove, onActivate);
  const row = Math.floor(position / fieldSize);
  const col = position % fieldSize;
  const style: React.CSSProperties = {
    position: 'absolute',
    width: cellSize,
    height: cellSize,
    left: gridPadding + col * (cellSize + gap),
    top: gridPadding + row * (cellSize + gap),
    zIndex: isDragging ? 100 : 10,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <motion.div style={style} className={styles.dragSurface} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.24, ease: 'easeInOut' }} {...pointerHandlers}>
      <div className={clsx(styles.draggableAttempt, { [styles['draggableAttempt--dragging']]: isDragging })}>
        <img src={uiConfig.icons.attempt} alt="" draggable={false} />
      </div>
    </motion.div>
  );
};

const GameBoard: React.FC<GameBoardProps> = ({
  mode,
  selectedBombs = [],
  revealedCells = [],
  bombPositions = [],
  foundBombPositions = [],
  onCellClick,
  attemptPosition = null,
  scannerPositions = [],
  scannerResult,
  scannerResults = [],
  radarResult,
  radarResults = [],
  disabled = false,
  completed = false,
  revealFinishedBombs = true,
  activeTool = null,
  onScannerPlaced,
  onRadarPlaced,
  onAttemptPlaced,
  onScannerConfirmed,
  onRadarConfirmed,
  onAttemptConfirmed,
  onRadarTypeToggle,
  fieldSize: fieldSizeProp,
}) => {
  const fieldSize = fieldSizeProp ?? defaultGameConfig.fieldSize;
  const cells = Array.from({ length: fieldSize * fieldSize }, (_, i) => i);

  const gridRef = useRef<HTMLDivElement>(null);
  const [gridDimensions, setGridDimensions] = useState({ cellSize: 0, gridPadding: 12, gap: 8 });

  // Scanner drag state
  const [scannerDragPos, setScannerDragPos] = useState({ row: 0, col: 0 });

  // Radar drag state
  const [radarDragIndex, setRadarDragIndex] = useState(0);
  const [attemptDragPosition, setAttemptDragPosition] = useState(0);
  const scannerDragPosRef = useRef(scannerDragPos);
  const radarDragIndexRef = useRef(radarDragIndex);
  const attemptDragPositionRef = useRef(attemptDragPosition);
  const dragOriginRef = useRef({ clientX: 0, clientY: 0, scanner: scannerDragPos, radar: radarDragIndex, attempt: attemptDragPosition });

  // Measure the layout box rather than getBoundingClientRect. The latter is
  // affected by parent scale animations and produced a too-small overlay on
  // the first render that only corrected itself after a window resize.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const updateDimensions = () => {
      const computedStyle = window.getComputedStyle(grid);
      const paddingLeft = Number.parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = Number.parseFloat(computedStyle.paddingRight) || 0;
      const gap = Number.parseFloat(computedStyle.columnGap) || 0;
      const availableSize = grid.clientWidth - paddingLeft - paddingRight;
      const cellSize = (availableSize - gap * (fieldSize - 1)) / fieldSize;

      if (cellSize <= 0) return;

      setGridDimensions((current) => {
        if (Math.abs(current.cellSize - cellSize) < 0.1 && current.gridPadding === paddingLeft && current.gap === gap) return current;
        return { cellSize, gridPadding: paddingLeft, gap };
      });
    };

    updateDimensions();
    const frameId = window.requestAnimationFrame(updateDimensions);
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(grid);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [fieldSize]);

  // Keep the local drag anchor synchronized with the preview owned by the
  // parent. Otherwise selecting a tool again can reuse its old coordinates.
  useEffect(() => {
    if (activeTool !== 'scanner' || scannerPositions.length !== 4) return;

    const topLeft = Math.min(...scannerPositions);
    const nextPosition = {
      row: Math.max(0, Math.min(fieldSize - 2, Math.floor(topLeft / fieldSize))),
      col: Math.max(0, Math.min(fieldSize - 2, topLeft % fieldSize)),
    };
    scannerDragPosRef.current = nextPosition;
    setScannerDragPos(nextPosition);
  }, [activeTool, fieldSize, scannerPositions]);

  useEffect(() => {
    if (activeTool === 'radar' && radarResult?.bombCount === -1) {
      const nextIndex = Math.max(0, Math.min(fieldSize - 1, radarResult.index));
      radarDragIndexRef.current = nextIndex;
      setRadarDragIndex(nextIndex);
    }
  }, [activeTool, fieldSize, radarResult?.bombCount, radarResult?.index, radarResult?.type]);

  useEffect(() => {
    if (activeTool !== 'click' || attemptPosition === null) return;
    const nextPosition = Math.max(0, Math.min(fieldSize ** 2 - 1, attemptPosition));
    attemptDragPositionRef.current = nextPosition;
    setAttemptDragPosition(nextPosition);
  }, [activeTool, attemptPosition, fieldSize]);

  const handleCellClick = (position: number) => {
    if (disabled) return;

    const row = Math.floor(position / fieldSize);
    const col = position % fieldSize;

    if (activeTool === 'click') {
      attemptDragPositionRef.current = position;
      setAttemptDragPosition(position);
      onAttemptPlaced?.(position);
      return;
    }

    if (activeTool === 'scanner') {
      const nextPosition = {
        row: Math.max(0, Math.min(fieldSize - 2, row)),
        col: Math.max(0, Math.min(fieldSize - 2, col)),
      };
      scannerDragPosRef.current = nextPosition;
      setScannerDragPos(nextPosition);
      onScannerPlaced?.([nextPosition.row * fieldSize + nextPosition.col, nextPosition.row * fieldSize + nextPosition.col + 1, (nextPosition.row + 1) * fieldSize + nextPosition.col, (nextPosition.row + 1) * fieldSize + nextPosition.col + 1]);
      return;
    }

    if (activeTool === 'radar') {
      const nextIndex = radarResult?.type === 'column' ? col : row;
      radarDragIndexRef.current = nextIndex;
      setRadarDragIndex(nextIndex);
      onRadarPlaced?.(nextIndex);
      return;
    }

    onCellClick?.(position);
  };

  const moveActiveArea = useCallback(
    (tool: 'scanner' | 'radar' | 'click', clientX: number, clientY: number) => {
      const stepSize = gridDimensions.cellSize + gridDimensions.gap;
      if (stepSize <= 0) return;
      const deltaX = clientX - dragOriginRef.current.clientX;
      const deltaY = clientY - dragOriginRef.current.clientY;

      if (tool === 'click') {
        const originRow = Math.floor(dragOriginRef.current.attempt / fieldSize);
        const originCol = dragOriginRef.current.attempt % fieldSize;
        const newCol = Math.max(0, Math.min(fieldSize - 1, originCol + Math.round(deltaX / stepSize)));
        const newRow = Math.max(0, Math.min(fieldSize - 1, originRow + Math.round(deltaY / stepSize)));
        const nextPosition = newRow * fieldSize + newCol;
        if (attemptDragPositionRef.current === nextPosition) return;
        attemptDragPositionRef.current = nextPosition;
        setAttemptDragPosition(nextPosition);
        onAttemptPlaced?.(nextPosition);
      } else if (tool === 'scanner') {
        const colDelta = Math.round(deltaX / stepSize);
        const rowDelta = Math.round(deltaY / stepSize);
        const newCol = Math.max(0, Math.min(fieldSize - 2, dragOriginRef.current.scanner.col + colDelta));
        const newRow = Math.max(0, Math.min(fieldSize - 2, dragOriginRef.current.scanner.row + rowDelta));

        if (scannerDragPosRef.current.row === newRow && scannerDragPosRef.current.col === newCol) return;

        const nextPosition = { row: newRow, col: newCol };
        scannerDragPosRef.current = nextPosition;
        setScannerDragPos(nextPosition);
        const positions = [newRow * fieldSize + newCol, newRow * fieldSize + newCol + 1, (newRow + 1) * fieldSize + newCol, (newRow + 1) * fieldSize + newCol + 1];
        onScannerPlaced?.(positions);
      } else {
        const isRow = radarResult?.type === 'row';
        const moveDelta = isRow ? deltaY : deltaX;
        const indexDelta = Math.round(moveDelta / stepSize);
        const newIndex = Math.max(0, Math.min(fieldSize - 1, dragOriginRef.current.radar + indexDelta));

        if (radarDragIndexRef.current === newIndex) return;

        radarDragIndexRef.current = newIndex;
        setRadarDragIndex(newIndex);
        onRadarPlaced?.(newIndex);
      }
    },
    [fieldSize, gridDimensions.cellSize, gridDimensions.gap, onAttemptPlaced, onRadarPlaced, onScannerPlaced, radarResult?.type],
  );

  const handleScannerDragStart = useCallback((clientX: number, clientY: number) => {
    dragOriginRef.current = { clientX, clientY, scanner: scannerDragPosRef.current, radar: radarDragIndexRef.current, attempt: attemptDragPositionRef.current };
  }, []);

  const handleRadarDragStart = useCallback((clientX: number, clientY: number) => {
    dragOriginRef.current = { clientX, clientY, scanner: scannerDragPosRef.current, radar: radarDragIndexRef.current, attempt: attemptDragPositionRef.current };
  }, []);

  const handleAttemptDragStart = useCallback((clientX: number, clientY: number) => {
    dragOriginRef.current = { clientX, clientY, scanner: scannerDragPosRef.current, radar: radarDragIndexRef.current, attempt: attemptDragPositionRef.current };
  }, []);

  const handleScannerDragMove = useCallback((clientX: number, clientY: number) => moveActiveArea('scanner', clientX, clientY), [moveActiveArea]);
  const handleRadarDragMove = useCallback((clientX: number, clientY: number) => moveActiveArea('radar', clientX, clientY), [moveActiveArea]);
  const handleAttemptDragMove = useCallback((clientX: number, clientY: number) => moveActiveArea('click', clientX, clientY), [moveActiveArea]);

  const getCellState = (position: number) => {
    const isSelected = selectedBombs.includes(position);
    const isRevealed = revealedCells.includes(position);
    const isFoundBomb = foundBombPositions.includes(position);
    const isBomb = bombPositions.includes(position) || isFoundBomb;
    const isInScannerPreview = scannerPositions.includes(position);
    const isInScannerResult = scannerResults.some((result) => result.positions.includes(position));
    const isInRadarPreview = radarResult && ((radarResult.type === 'row' && Math.floor(position / fieldSize) === radarResult.index) || (radarResult.type === 'column' && position % fieldSize === radarResult.index));
    const isInRadarResult = radarResults.some((result) => (result.type === 'row' ? Math.floor(position / fieldSize) === result.index : position % fieldSize === result.index));

    return { isSelected, isRevealed, isBomb, isFoundBomb, isInScannerPreview, isInScannerResult, isInRadarPreview, isInRadarResult };
  };

  // Check if we're in drag mode for scanner/radar
  const showDraggableScanner = activeTool === 'scanner' && scannerPositions.length > 0 && (scannerResult === undefined || scannerResult < 0);
  const showDraggableRadar = activeTool === 'radar' && radarResult && radarResult.bombCount < 0;
  const showDraggableAttempt = activeTool === 'click' && attemptPosition !== null;

  const cellStep = gridDimensions.cellSize + gridDimensions.gap;
  const getScannerResultPosition = (positions: number[]) => {
    const topLeft = Math.min(...positions);
    return {
      left: gridDimensions.gridPadding + (topLeft % fieldSize) * cellStep + (gridDimensions.cellSize * 2 + gridDimensions.gap) / 2,
      top: gridDimensions.gridPadding + Math.floor(topLeft / fieldSize) * cellStep + (gridDimensions.cellSize * 2 + gridDimensions.gap) / 2,
    };
  };
  const getRadarResultPosition = (result: RadarResult) =>
    result.type === 'row'
      ? {
          // Keep the result outside the grid: its center sits on the left
          // edge of the first cell in the scanned row.
          left: gridDimensions.gridPadding,
          top: gridDimensions.gridPadding + result.index * cellStep + gridDimensions.cellSize / 2,
        }
      : {
          left: gridDimensions.gridPadding + result.index * cellStep + gridDimensions.cellSize / 2,
          // For a column, center the result on the top edge of its first cell.
          top: gridDimensions.gridPadding,
        };
  const resultOverlaySizeClass = fieldSize === 4 ? styles['resultOverlay--medium'] : fieldSize >= 5 ? styles['resultOverlay--hard'] : undefined;

  return (
    <div className={styles.board}>
      <div
        ref={gridRef}
        className={clsx(styles.grid, {
          [styles['grid--scanner-active']]: showDraggableScanner,
          [styles['grid--radar-active']]: showDraggableRadar,
          [styles['grid--attempt-active']]: showDraggableAttempt,
        })}
        style={{
          gridTemplateColumns: `repeat(${fieldSize}, 1fr)`,
          gridTemplateRows: `repeat(${fieldSize}, 1fr)`,
        }}>
        <AnimatePresence>
          {cells.map((position) => {
            const { isSelected, isRevealed, isBomb, isFoundBomb, isInScannerPreview, isInScannerResult, isInRadarPreview, isInRadarResult } = getCellState(position);
            const isInScannerArea = isInScannerResult || isInScannerPreview;
            const isInRadarArea = Boolean(isInRadarResult || isInRadarPreview);
            const isAreaIntersection = isInScannerArea && isInRadarArea;
            const isActiveScannerCell = Boolean(showDraggableScanner && isInScannerPreview);
            const isActiveRadarCell = Boolean(showDraggableRadar && isInRadarPreview);
            const isAttemptPreview = attemptPosition === position;

            return (
              <motion.button
                key={position}
                className={clsx(styles.cell, {
                  [styles['cell--selected']]: isSelected,
                  [styles['cell--revealed']]: isRevealed,
                  [styles['cell--bomb']]: (isRevealed && isFoundBomb) || (completed && revealFinishedBombs && isBomb),
                  [styles['cell--found-bomb']]: isRevealed && isFoundBomb,
                  [styles['cell--safe']]: isRevealed && !isFoundBomb && !isBomb,
                  // The API calls the 2x2 radar action SCANNER and the line
                  // scanner action RADAR. CSS names follow the UI terminology.
                  [styles['cell--radar']]: isInScannerArea,
                  [styles['cell--scanner']]: isInRadarArea,
                  [styles['cell--radar-active']]: isActiveScannerCell,
                  [styles['cell--scanner-active']]: isActiveRadarCell,
                  [styles['cell--attempt-preview']]: isAttemptPreview,
                  [styles['cell--attempt-active']]: showDraggableAttempt && isAttemptPreview,
                  [styles['cell--intersection']]: isAreaIntersection,
                  [styles['cell--clickable']]: !disabled && mode !== 'view' && Boolean(onCellClick || activeTool),
                })}
                whileTap={!disabled && mode !== 'view' && Boolean(onCellClick) && activeTool === null ? { scale: 0.9 } : undefined}
                transition={{ type: 'spring', stiffness: 520, damping: 24, mass: 0.55 }}
                onClick={() => handleCellClick(position)}
                disabled={disabled || mode === 'view'}>
                {mode === 'setup' && isSelected && (
                  <motion.span className={styles.bombIcon} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <BombIcon size="75%" />
                  </motion.span>
                )}
                {isRevealed && isFoundBomb && (
                  <motion.span className={styles.foundBombIcon} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}>
                    <BombIcon size="75%" />
                  </motion.span>
                )}
                {isRevealed && !isFoundBomb && !isBomb && (
                  <motion.span className={styles.safeIcon} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.28, type: 'spring', stiffness: 520, damping: 22 }}>
                    <svg aria-hidden="true" viewBox="0 0 1216 1312">
                      <path
                        fill="currentColor"
                        d="M1202 1066q0 40-28 68l-136 136q-28 28-68 28t-68-28L608 976l-294 294q-28 28-68 28t-68-28L42 1134q-28-28-28-68t28-68l294-294L42 410q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294l294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68L880 704l294 294q28 28 28 68"
                      />
                    </svg>
                  </motion.span>
                )}
                {mode === 'view' && !isRevealed && isBomb && (!completed || revealFinishedBombs) && (
                  <motion.span className={styles.hiddenBomb} initial={{ opacity: 0, scale: 0.25, rotate: -18 }} animate={{ opacity: completed ? 1 : 0.3, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 17, mass: 0.75 }}>
                    <BombIcon size="75%" />
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {showDraggableAttempt && gridDimensions.cellSize > 0 && (
            <DraggableAttempt
              key="attempt-overlay"
              position={attemptDragPosition}
              fieldSize={fieldSize}
              cellSize={gridDimensions.cellSize}
              gridPadding={gridDimensions.gridPadding}
              gap={gridDimensions.gap}
              onDragStart={handleAttemptDragStart}
              onDragMove={handleAttemptDragMove}
              onActivate={onAttemptConfirmed}
            />
          )}
        </AnimatePresence>

        {/* Draggable Scanner */}
        <AnimatePresence>
          {showDraggableScanner && gridDimensions.cellSize > 0 && (
            <DraggableScanner key="scanner-overlay" currentRow={scannerDragPos.row} currentCol={scannerDragPos.col} cellSize={gridDimensions.cellSize} gridPadding={gridDimensions.gridPadding} gap={gridDimensions.gap} onDragStart={handleScannerDragStart} onDragMove={handleScannerDragMove} onActivate={onScannerConfirmed} />
          )}
        </AnimatePresence>

        {/* Draggable Radar */}
        <AnimatePresence mode="wait">
          {showDraggableRadar && gridDimensions.cellSize > 0 && radarResult && (
            <DraggableRadar
              key={`radar-overlay-${radarResult.type}`}
              fieldSize={fieldSize}
              type={radarResult.type}
              index={radarDragIndex}
              cellSize={gridDimensions.cellSize}
              gridPadding={gridDimensions.gridPadding}
              gap={gridDimensions.gap}
              onTypeToggle={onRadarTypeToggle}
              onDragStart={handleRadarDragStart}
              onDragMove={handleRadarDragMove}
              onActivate={onRadarConfirmed}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Scanner overlay result - only show count if not in preview mode */}
      {gridDimensions.cellSize > 0 &&
        scannerResults.map((result, index) => (
          <div key={`scanner-result-${index}`} className={clsx(styles.scannerOverlay, resultOverlaySizeClass)} style={getScannerResultPosition(result.positions)}>
            <span className={styles.scannerCount}>
              {/* <BombIcon size={24} /> */}
              {result.bombCount}
            </span>
          </div>
        ))}
      {gridDimensions.cellSize > 0 && scannerPositions.length > 0 && scannerResult !== undefined && scannerResult >= 0 && (
        <div className={clsx(styles.scannerOverlay, resultOverlaySizeClass)} style={getScannerResultPosition(scannerPositions)}>
          <span className={styles.scannerCount}>
            {/* <BombIcon size={24} /> */}
            {scannerResult}
          </span>
        </div>
      )}

      {/* Radar result - only show count if bombCount >= 0 (not preview) */}
      {gridDimensions.cellSize > 0 &&
        radarResults.map((result, index) => (
          <div key={`radar-result-${index}`} className={clsx(styles.radarOverlay, resultOverlaySizeClass)} style={getRadarResultPosition(result)}>
            <span className={styles.radarCount}>
              {/* <BombIcon size={20} /> */}
              {result.bombCount}
            </span>
          </div>
        ))}
      {gridDimensions.cellSize > 0 && radarResult && radarResult.bombCount >= 0 && (
        <div className={clsx(styles.radarOverlay, resultOverlaySizeClass)} style={getRadarResultPosition(radarResult)}>
          <span className={styles.radarCount}>
            {/* <BombIcon size={20} /> */}
            {radarResult.bombCount}
          </span>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
