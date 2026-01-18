import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './GameLobby.module.scss';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import GameBoard from '@/components/common/GameBoard';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import Timer from '@/components/common/Timer';
import DifficultyIndicator from '@/components/common/DifficultyIndicator';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { setActiveDefense, setLastMoveResult, setAttacking } from '@/redux/slices/game.slice';
import { closeGameLobby, openResultModal, showToast } from '@/redux/slices/ui.slice';
import { updateBalance } from '@/redux/slices/auth.slice';
import { socketService } from '@/services/socket';
import { getConfigByDifficulty } from '@/config/game.config';
import { DefensePublic, MoveResult } from '@/types';
import { formatRelativeTime } from '@/utils/formatTime';

const GameLobby: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOpen, defenseId } = useAppSelector((state) => state.ui.gameLobbyModal);
  const { activeDefense, isAttacking } = useAppSelector((state) => state.game);
  const { user } = useAppSelector((state) => state.auth);

  const [activeTool, setActiveTool] = useState<'click' | 'scanner' | 'radar' | null>(null);
  const [scannerPositions, setScannerPositions] = useState<number[]>([]);
  const [isProcessingMove, setIsProcessingMove] = useState(false);

  // Preview states for scanner/radar placement
  const [scannerPreview, setScannerPreview] = useState<number[] | null>(null);
  const [radarPreview, setRadarPreview] = useState<{ type: 'row' | 'column'; index: number; bombCount: number } | null>(null);

  useEffect(() => {
    if (isOpen && defenseId) {
      loadDefense();
      socketService.joinDefenseRoom(defenseId);

      // Subscribe to game events
      socketService.on('gameStarted', handleGameStarted);
      socketService.on('moveMade', handleMoveMade);
      socketService.on('gameFinished', handleGameFinished);
      socketService.on('balanceUpdated', handleBalanceUpdated);
    }

    return () => {
      if (defenseId) {
        socketService.leaveDefenseRoom(defenseId);
      }
      socketService.off('gameStarted', handleGameStarted);
      socketService.off('moveMade', handleMoveMade);
      socketService.off('gameFinished', handleGameFinished);
      socketService.off('balanceUpdated', handleBalanceUpdated);
    };
  }, [isOpen, defenseId]);

  const loadDefense = async () => {
    if (!defenseId) return;
    try {
      const defense = await socketService.getDefense(defenseId);
      dispatch(setActiveDefense(defense));
    } catch (error) {
      console.error('Failed to load defense:', error);
    }
  };

  const handleGameStarted = (defense: DefensePublic) => {
    dispatch(setActiveDefense(defense));
  };

  const handleMoveMade = (data: { defenseId: number; move: MoveResult }) => {
    if (data.defenseId === defenseId) {
      dispatch(setLastMoveResult(data.move));
      loadDefense();
    }
  };

  const handleGameFinished = (defense: DefensePublic) => {
    dispatch(setActiveDefense(defense));

    if (user) {
      const isWinner = defense.winnerId === user.id;
      const isAttacker = defense.attacker?.id === user.id;

      if (defense.result === 'ATTACKER_TOOK_HALF') {
        dispatch(
          openResultModal({
            type: 'half',
            amount: Math.floor(defense.bet / 2),
          }),
        );
      } else if (isWinner) {
        // Show net profit (opponent's bet), not total received
        dispatch(
          openResultModal({
            type: 'win',
            amount: defense.bet,
          }),
        );
      } else if (isAttacker || defense.creator.id === user.id) {
        dispatch(
          openResultModal({
            type: 'lose',
            amount: defense.bet,
          }),
        );
      }
    }
  };

  const handleBalanceUpdated = (data: { balance: number }) => {
    dispatch(updateBalance(data.balance));
  };

  const handleClose = () => {
    dispatch(closeGameLobby());
    dispatch(setActiveDefense(null));
    dispatch(setLastMoveResult(null));
    setActiveTool(null);
    setScannerPositions([]);
    setScannerPreview(null);
    setRadarPreview(null);
  };

  const handleAttack = async () => {
    if (!defenseId) return;
    try {
      dispatch(setAttacking(true));
      await socketService.attackDefense(defenseId);
      dispatch(showToast({ message: 'Атака началась!', type: 'success' }));
    } catch (error: any) {
      dispatch(showToast({ message: error.message || 'Ошибка атаки', type: 'error' }));
    } finally {
      dispatch(setAttacking(false));
    }
  };

  const handleCellClick = async (position: number) => {
    if (!defenseId || !activeDefense || isProcessingMove) return;
    if (activeDefense.attacker?.id !== user?.id) return;

    try {
      setIsProcessingMove(true);
      await socketService.makeMove(defenseId, 'CLICK', position);
    } catch (error: any) {
      dispatch(showToast({ message: error.message || 'Ошибка хода', type: 'error' }));
    } finally {
      setIsProcessingMove(false);
    }
  };

  // Preview handlers - just set the preview, don't submit yet
  const handleScannerPreview = (positions: number[]) => {
    setScannerPreview(positions);
  };

  const handleRadarPreview = (index: number) => {
    // Keep current type if we have one, otherwise default to row
    // bombCount -1 indicates preview mode
    const currentType = radarPreview?.type || 'row';
    setRadarPreview({ type: currentType, index, bombCount: -1 });
  };

  // Toggle radar type (row/column)
  const toggleRadarType = () => {
    if (radarPreview) {
      setRadarPreview({
        type: radarPreview.type === 'row' ? 'column' : 'row',
        index: radarPreview.index,
        bombCount: -1,
      });
    }
  };

  // Confirm scanner placement
  const confirmScanner = async () => {
    if (!defenseId || !activeDefense || isProcessingMove || !scannerPreview) return;

    try {
      setIsProcessingMove(true);
      await socketService.makeMove(defenseId, 'SCANNER', undefined, scannerPreview);
      setScannerPositions(scannerPreview);
      setScannerPreview(null);
      setActiveTool(null);
    } catch (error: any) {
      dispatch(showToast({ message: error.message || 'Ошибка сканера', type: 'error' }));
    } finally {
      setIsProcessingMove(false);
    }
  };

  // Confirm radar placement
  const confirmRadar = async () => {
    if (!defenseId || !activeDefense || isProcessingMove || !radarPreview) return;

    try {
      setIsProcessingMove(true);
      // Pass radar type in positions array: [type (0=row, 1=column), index]
      const radarData = [radarPreview.type === 'row' ? 0 : 1, radarPreview.index];
      await socketService.makeMove(defenseId, 'RADAR', radarPreview.index, radarData);
      setRadarPreview(null);
      setActiveTool(null);
    } catch (error: any) {
      dispatch(showToast({ message: error.message || 'Ошибка радара', type: 'error' }));
    } finally {
      setIsProcessingMove(false);
    }
  };

  // Cancel tool selection
  const cancelTool = () => {
    setActiveTool(null);
    setScannerPreview(null);
    setRadarPreview(null);
  };

  const handleTakeHalf = async () => {
    if (!defenseId) return;
    try {
      await socketService.takeHalf(defenseId);
    } catch (error: any) {
      dispatch(showToast({ message: error.message || 'Ошибка', type: 'error' }));
    }
  };

  if (!activeDefense) return null;

  // Get config based on defense difficulty
  const gameConfig = getConfigByDifficulty(activeDefense.difficulty);

  const isDefender = activeDefense.creator.id === user?.id;
  const isAttackerRole = activeDefense.attacker?.id === user?.id;
  const isGameActive = activeDefense.status === 'IN_PROGRESS';
  const isWaiting = activeDefense.status === 'WAITING';
  const isFinished = activeDefense.status === 'FINISHED';
  const isExpired = activeDefense.status === 'EXPIRED' || (activeDefense.status === 'WAITING' && new Date(activeDefense.expiresAt).getTime() <= Date.now());
  const canAttack = isWaiting && !isDefender && user && !isExpired;
  const canMakeMove = isGameActive && isAttackerRole && !isProcessingMove;

  const attemptsLeft = gameConfig.attempts - activeDefense.attemptsUsed;
  const scannersLeft = gameConfig.scanners - activeDefense.scannersUsed;
  const radarsLeft = gameConfig.radars - activeDefense.radarsUsed;
  const canTakeHalf = activeDefense.bombsFound >= 1 && isAttackerRole && isGameActive;

  // Calculate potential win - net profit is defender's bet (attacker gets their bet back + defender's bet)
  // No commission currently applied
  const potentialWin = activeDefense.bet;

  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge variant="warning">Истекла ⏰</Badge>;
    }
    if (isWaiting) {
      return <Badge variant="info">Ожидание атаки ⏳</Badge>;
    }
    if (isGameActive) {
      return <Badge variant="error">Идет атака ⚔️</Badge>;
    }
    if (isFinished) {
      return <Badge variant="success">Завершена ✅</Badge>;
    }
    return null;
  };

  // Get result info for finished or expired games
  const getResultInfo = () => {
    // Expired defense - show refund for defender
    if (isExpired && isDefender) {
      return { label: 'Возврат', variant: 'refund' as const, amount: activeDefense.bet };
    }

    if (!isFinished || !user) return null;

    const isWinner = activeDefense.winnerId === user.id;
    const isAttacker = activeDefense.attacker?.id === user.id;
    const isCreator = activeDefense.creator.id === user.id;

    if (activeDefense.result === 'ATTACKER_TOOK_HALF') {
      if (isAttacker) {
        return { label: 'Вы забрали половину', variant: 'win' as const, amount: Math.floor(activeDefense.bet / 2) };
      }
      if (isCreator) {
        return { label: 'Противник забрал половину', variant: 'lose' as const, amount: Math.floor(activeDefense.bet / 2) };
      }
    }

    if (isWinner) {
      // Winner gets: their bet back + opponent's bet = bet * 2 total
      // But show net profit: just the opponent's bet (= activeDefense.bet)
      return { label: 'Победа!', variant: 'win' as const, amount: activeDefense.bet };
    }

    if (isAttacker || isCreator) {
      // Loser loses their bet
      return { label: 'Поражение', variant: 'lose' as const, amount: activeDefense.bet };
    }

    return null;
  };

  const resultInfo = getResultInfo();
  // For expired defenses, use expiresAt since finishedAt is null
  const finishedTime = isFinished ? formatRelativeTime(activeDefense.finishedAt) : isExpired ? formatRelativeTime(activeDefense.expiresAt) : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Битва #${activeDefense.id}`}>
      <div className={styles.lobby}>
        {/* Status */}
        <div className={styles.statusSection}>
          {getStatusBadge()}
          <DifficultyIndicator difficulty={activeDefense.difficulty} showLabel />
          {isGameActive && activeDefense.moveDeadline && <Timer endTime={new Date(activeDefense.moveDeadline).getTime()} type="badge" prefix="⏱️ " />}
          {(isFinished || isExpired) && finishedTime && <span className={styles.finishedTime}>{finishedTime}</span>}
        </div>

        {/* Players */}
        <div className={styles.players}>
          <div className={styles.player}>
            <Avatar src={activeDefense.creator.photoUrl} name={activeDefense.creator.firstName} size="lg" />
            <span className={styles.playerName}>{activeDefense.creator.firstName || activeDefense.creator.username || 'Защитник'}</span>
            <span className={styles.playerRole}>🛡️ Защитник</span>
          </div>

          <div className={styles.vs}>VS</div>

          <div className={styles.player}>
            {activeDefense.attacker ? (
              <>
                <Avatar src={activeDefense.attacker.photoUrl} name={activeDefense.attacker.firstName} size="lg" />
                <span className={styles.playerName}>{activeDefense.attacker.firstName || activeDefense.attacker.username || 'Атакующий'}</span>
              </>
            ) : (
              <>
                <div className={styles.emptyAvatar}>?</div>
                <span className={styles.playerName}>Ожидание...</span>
              </>
            )}
            <span className={styles.playerRole}>⚔️ Атакующий</span>
          </div>
        </div>

        {/* Game Board */}
        <div className={styles.boardSection}>
          <GameBoard
            mode={isGameActive && isAttackerRole ? 'play' : 'view'}
            revealedCells={activeDefense.revealedCells}
            bombPositions={activeDefense.bombPositions || []}
            foundBombPositions={activeDefense.foundBombPositions || []}
            onCellClick={canMakeMove && !activeTool ? handleCellClick : undefined}
            activeTool={activeTool}
            onScannerPlaced={canMakeMove ? handleScannerPreview : undefined}
            onRadarPlaced={canMakeMove ? handleRadarPreview : undefined}
            scannerPositions={scannerPreview || scannerPositions}
            scannerResult={!scannerPreview && activeDefense.scannerResults?.length ? activeDefense.scannerResults[activeDefense.scannerResults.length - 1].bombCount : undefined}
            radarResult={radarPreview || (activeDefense.radarResults?.length ? activeDefense.radarResults[activeDefense.radarResults.length - 1] : null)}
            disabled={!canMakeMove}
            fieldSize={gameConfig.fieldSize}
          />
        </div>

        {/* Tool confirmation buttons */}
        {(scannerPreview || radarPreview) && (
          <div className={styles.toolConfirm}>
            {radarPreview && (
              <Button color="secondary" size="sm" onClick={toggleRadarType}>
                {radarPreview.type === 'row' ? '↔ Строка' : '↕ Столбец'}
              </Button>
            )}
            <Button color="primary" size="sm" onClick={scannerPreview ? confirmScanner : confirmRadar} loading={isProcessingMove}>
              Подтвердить
            </Button>
            <Button color="secondary" size="sm" onClick={cancelTool}>
              Отмена
            </Button>
          </div>
        )}

        {/* Pre-attack Game Info (for waiting games - both defender and attacker) */}
        {isWaiting && !isExpired && (
          <div className={styles.gameInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>🎯</span>
              <span>Найди {gameConfig.bombsCount} 💣 бомбы</span>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>☝️ Попытки</span>
                <span className={styles.statValue}>{gameConfig.attempts}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>📡 Радары</span>
                <span className={styles.statValue}>{gameConfig.radars}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>📶 Сканеры</span>
                <span className={styles.statValue}>{gameConfig.scanners}</span>
              </div>
            </div>
            {isDefender ? (
              <div className={styles.betInfo}>
                <div className={styles.betLabel}>Ставка</div>
                <div className={styles.betAmount}>
                  <span className={styles.star}>⭐</span>
                  {activeDefense.bet}
                </div>
              </div>
            ) : (
              <div className={styles.winInfo}>
                <div className={styles.winLabel}>Выигрыш</div>
                <div className={styles.winAmount}>
                  <span className={styles.star}>⭐</span>
                  {potentialWin}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Game Info */}
        {isGameActive && (
          <div className={styles.gameInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>🎯</span>
              <span>Найди {gameConfig.bombsCount} бомбы</span>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Попытки</span>
                <span className={styles.statValue}>
                  {attemptsLeft}/{gameConfig.attempts}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Найдено</span>
                <span className={styles.statValue}>
                  💣 {activeDefense.bombsFound}/{gameConfig.bombsCount}
                </span>
              </div>
            </div>

            {/* Tools */}
            {isAttackerRole && (
              <div className={styles.tools}>
                <button
                  className={clsx(styles.tool, { [styles.active]: activeTool === 'scanner' })}
                  onClick={() => {
                    if (activeTool === 'scanner') {
                      cancelTool();
                    } else {
                      setActiveTool('scanner');
                      // Initialize scanner at position [0,0]
                      const positions = [0, 1, gameConfig.fieldSize, gameConfig.fieldSize + 1];
                      setScannerPreview(positions);
                    }
                  }}
                  disabled={scannersLeft <= 0 || isProcessingMove}
                >
                  <span className={styles.toolIcon}>🔍</span>
                  <span className={styles.toolName}>Сканер</span>
                  <span className={styles.toolCount}>{scannersLeft}</span>
                </button>
                <button
                  className={clsx(styles.tool, { [styles.active]: activeTool === 'radar' })}
                  onClick={() => {
                    if (activeTool === 'radar') {
                      cancelTool();
                    } else {
                      setActiveTool('radar');
                      // Initialize radar at row 0
                      setRadarPreview({ type: 'row', index: 0, bombCount: -1 });
                    }
                  }}
                  disabled={radarsLeft <= 0 || isProcessingMove}
                >
                  <span className={styles.toolIcon}>📡</span>
                  <span className={styles.toolName}>Радар</span>
                  <span className={styles.toolCount}>{radarsLeft}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Finished/Expired Game Result */}
        {(isFinished || isExpired) && resultInfo && (
          <div className={clsx(styles.resultCard, styles[`resultCard--${resultInfo.variant}`])}>
            <div className={styles.resultLabel}>{resultInfo.label}</div>
            <div className={clsx(styles.resultAmount, styles[`resultAmount--${resultInfo.variant}`])}>
              {resultInfo.variant === 'win' || resultInfo.variant === 'refund' ? '+' : '-'}
              {resultInfo.amount}
              <span className={styles.star}>⭐</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {canAttack && (
            <Button color="error" size="lg" fullWidth loading={isAttacking} onClick={handleAttack}>
              Атаковать за ⭐ {activeDefense.bet}
            </Button>
          )}

          {canTakeHalf && (
            <Button color="warning" size="lg" fullWidth onClick={handleTakeHalf}>
              Забрать ⭐ {Math.floor(activeDefense.bet / 2)} (50%)
            </Button>
          )}

          {(isFinished || isExpired) && (
            <Button color="secondary" size="lg" fullWidth onClick={handleClose}>
              Закрыть
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default GameLobby;
