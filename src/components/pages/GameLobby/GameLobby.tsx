import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './GameLobby.module.scss';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import GameBoard from '@/components/common/GameBoard';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import Timer from '@/components/common/Timer';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { setActiveDefense, setLastMoveResult, setAttacking, updateDefense } from '@/redux/slices/game.slice';
import { closeGameLobby, openResultModal, showToast } from '@/redux/slices/ui.slice';
import { updateBalance } from '@/redux/slices/auth.slice';
import { socketService } from '@/services/socket';
import { getConfigByDifficulty } from '@/config/game.config';
import { DefensePublic, MoveResult, ToolPreview } from '@/types';
import { star } from '@/utils/icons';
import BombIcon from '@/components/common/BombIcon';
import { uiConfig } from '@/config/ui.config';

const GameLobby: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isOpen, defenseId } = useAppSelector((state) => state.ui.gameLobbyModal);
  const { activeDefense, isAttacking } = useAppSelector((state) => state.game);
  const { user } = useAppSelector((state) => state.auth);

  const [activeTool, setActiveTool] = useState<'click' | 'scanner' | 'radar' | null>(null);
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [isFinishingSequence, setIsFinishingSequence] = useState(false);
  const [revealFinishedBombs, setRevealFinishedBombs] = useState(true);
  const pendingClickRef = useRef<{ position: number; startedAt: number } | null>(null);
  const finishSequenceTimersRef = useRef<number[]>([]);

  const clearFinishSequence = () => {
    finishSequenceTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    finishSequenceTimersRef.current = [];
  };

  const queueFinishStep = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    finishSequenceTimersRef.current.push(timer);
  };

  // Preview states for tool placement
  const [attemptPreview, setAttemptPreview] = useState<number | null>(null);
  const [scannerPreview, setScannerPreview] = useState<number[] | null>(null);
  const [radarPreview, setRadarPreview] = useState<{ type: 'row' | 'column'; index: number; bombCount: number } | null>(null);

  useEffect(() => {
    if (isOpen && defenseId) {
      loadDefense();
      socketService.joinDefenseRoom(defenseId);

      // Subscribe to game events
      socketService.on('gameStarted', handleGameStarted);
      socketService.on('moveMade', handleMoveMade);
      socketService.on('toolPreviewUpdated', handleToolPreviewUpdated);
      socketService.on('gameFinished', handleGameFinished);
      socketService.on('balanceUpdated', handleBalanceUpdated);
    }

    return () => {
      clearFinishSequence();
      if (defenseId) {
        socketService.leaveDefenseRoom(defenseId);
      }
      socketService.off('gameStarted', handleGameStarted);
      socketService.off('moveMade', handleMoveMade);
      socketService.off('toolPreviewUpdated', handleToolPreviewUpdated);
      socketService.off('gameFinished', handleGameFinished);
      socketService.off('balanceUpdated', handleBalanceUpdated);
    };
  }, [isOpen, defenseId]);

  const loadDefense = async () => {
    if (!defenseId) return;
    try {
      const defense = await socketService.getDefense(defenseId);
      dispatch(setActiveDefense(defense));
      dispatch(updateDefense(defense));
    } catch (error) {
      console.error('Failed to load defense:', error);
    }
  };

  const handleGameStarted = (defense: DefensePublic) => {
    if (defense.id !== defenseId) return;
    dispatch(setActiveDefense(defense));
    dispatch(updateDefense(defense));
  };

  const handleMoveMade = (data: { defenseId: number; move: MoveResult }) => {
    if (data.defenseId === defenseId) {
      dispatch(setLastMoveResult(data.move));
      const isOwnPendingClick = data.move.moveType === 'CLICK' && pendingClickRef.current?.position === data.move.position;
      if (!isOwnPendingClick) loadDefense();
    }
  };

  const handleToolPreviewUpdated = (data: { defenseId: number; preview: ToolPreview }) => {
    if (data.defenseId !== defenseId) return;

    if (!data.preview) {
      setAttemptPreview(null);
      setScannerPreview(null);
      setRadarPreview(null);
    } else if (data.preview.moveType === 'CLICK') {
      setAttemptPreview(data.preview.position);
      setScannerPreview(null);
      setRadarPreview(null);
    } else if (data.preview.moveType === 'SCANNER') {
      setAttemptPreview(null);
      setScannerPreview(data.preview.positions);
      setRadarPreview(null);
    } else {
      setAttemptPreview(null);
      setRadarPreview({ type: data.preview.radarType, index: data.preview.index, bombCount: -1 });
      setScannerPreview(null);
    }
  };

  const handleGameFinished = (defense: DefensePublic) => {
    const showResult = () => {
      if (!user) return;
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
    };

    const pendingClick = pendingClickRef.current;
    const isFinalMiss = defense.result === 'DEFENDER_WIN' && defense.attacker?.id === user?.id && pendingClick !== null && !defense.bombPositions?.includes(pendingClick.position);

    clearFinishSequence();

    if (!isFinalMiss) {
      setIsFinishingSequence(false);
      setRevealFinishedBombs(true);
      dispatch(setActiveDefense(defense));
      dispatch(updateDefense(defense));
      showResult();
      return;
    }

    setIsFinishingSequence(true);
    setRevealFinishedBombs(false);

    // Keep the game visually active for the failed-cell reveal. Hidden bombs
    // are introduced only after that animation has completed.
    const clickReleaseDelay = Math.max(0, 180 - (performance.now() - pendingClick.startedAt));
    queueFinishStep(() => {
      dispatch(
        setActiveDefense({
          ...defense,
          status: 'IN_PROGRESS',
          result: null,
          winnerId: null,
          finishedAt: null,
          bombPositions: undefined,
        }),
      );
    }, clickReleaseDelay);

    queueFinishStep(() => {
      setIsFinishingSequence(false);
      setRevealFinishedBombs(true);
      dispatch(setActiveDefense(defense));
      dispatch(updateDefense(defense));
    }, clickReleaseDelay + 700);

    queueFinishStep(showResult, clickReleaseDelay + 1450);
  };

  const handleBalanceUpdated = (data: { balance: number }) => {
    dispatch(updateBalance(data.balance));
  };

  const handleClose = () => {
    clearFinishSequence();
    pendingClickRef.current = null;
    setIsFinishingSequence(false);
    setRevealFinishedBombs(true);
    dispatch(closeGameLobby());
    dispatch(setActiveDefense(null));
    dispatch(setLastMoveResult(null));
    setActiveTool(null);
    setAttemptPreview(null);
    setScannerPreview(null);
    setRadarPreview(null);
    if (defenseId && activeDefense?.attacker?.id === user?.id) {
      socketService.updateToolPreview(defenseId, null);
    }
  };

  const handleAttack = async () => {
    if (!defenseId) return;
    try {
      dispatch(setAttacking(true));
      await socketService.attackDefense(defenseId);
      dispatch(showToast({ message: uiConfig.gameLobby.attackStarted, type: 'success' }));
    } catch (error: any) {
      dispatch(showToast({ message: error.message || uiConfig.gameLobby.attackError, type: 'error' }));
    } finally {
      dispatch(setAttacking(false));
    }
  };

  const handleCellClick = async (position: number) => {
    if (!defenseId || !activeDefense || isProcessingMove) return false;
    if (activeDefense.attacker?.id !== user?.id) return false;

    try {
      setIsProcessingMove(true);
      setIsFinishingSequence(true);
      setRevealFinishedBombs(false);
      pendingClickRef.current = { position, startedAt: performance.now() };
      const result = await socketService.makeMove(defenseId, 'CLICK', position);
      dispatch(setLastMoveResult(result));
      if (!result.gameFinished) {
        const elapsed = performance.now() - pendingClickRef.current.startedAt;
        if (elapsed < 180) {
          await new Promise((resolve) => window.setTimeout(resolve, 180 - elapsed));
        }
        dispatch(
          setActiveDefense({
            ...activeDefense,
            revealedCells: result.revealedCells,
            foundBombPositions: result.isBomb ? Array.from(new Set([...(activeDefense.foundBombPositions || []), position])) : activeDefense.foundBombPositions || [],
            bombsFound: result.bombsFound,
            attemptsUsed: result.attemptsUsed,
            scannersUsed: result.scannersUsed,
            radarsUsed: result.radarsUsed,
          }),
        );
        setIsFinishingSequence(false);
        setRevealFinishedBombs(true);
      }
      return true;
    } catch (error: any) {
      setIsFinishingSequence(false);
      setRevealFinishedBombs(true);
      dispatch(showToast({ message: error.message || uiConfig.gameLobby.moveError, type: 'error' }));
      return false;
    } finally {
      pendingClickRef.current = null;
      setIsProcessingMove(false);
    }
  };

  // Preview handlers - just set the preview, don't submit yet
  const handleAttemptPreview = (position: number) => {
    setAttemptPreview(position);
    if (defenseId) socketService.updateToolPreview(defenseId, { moveType: 'CLICK', position });
  };

  const handleEmptyCellClick = (position: number) => {
    if (!activeDefense || activeDefense.revealedCells.includes(position)) return;

    setActiveTool('click');
    setScannerPreview(null);
    setRadarPreview(null);
    handleAttemptPreview(position);
  };

  const handleScannerPreview = (positions: number[]) => {
    setScannerPreview(positions);
    if (defenseId) socketService.updateToolPreview(defenseId, { moveType: 'SCANNER', positions });
  };

  const handleRadarPreview = (index: number) => {
    // Keep current type if we have one, otherwise default to row
    // bombCount -1 indicates preview mode
    const currentType = radarPreview?.type || 'row';
    setRadarPreview({ type: currentType, index, bombCount: -1 });
    if (defenseId) socketService.updateToolPreview(defenseId, { moveType: 'RADAR', radarType: currentType, index });
  };

  // Toggle radar type (row/column)
  const toggleScannerType = () => {
    if (radarPreview) {
      setRadarPreview({
        type: radarPreview.type === 'row' ? 'column' : 'row',
        index: radarPreview.index,
        bombCount: -1,
      });
      if (defenseId) {
        socketService.updateToolPreview(defenseId, {
          moveType: 'RADAR',
          radarType: radarPreview.type === 'row' ? 'column' : 'row',
          index: radarPreview.index,
        });
      }
    }
  };

  // Confirm scanner placement
  const confirmScanner = async () => {
    if (!defenseId || !activeDefense || isProcessingMove || !scannerPreview) return;

    try {
      setIsProcessingMove(true);
      const result = await socketService.makeMove(defenseId, 'SCANNER', undefined, scannerPreview);
      dispatch(setLastMoveResult(result));
      await loadDefense();
      setScannerPreview(null);
      setActiveTool(null);
      socketService.updateToolPreview(defenseId, null);
    } catch (error: any) {
      dispatch(showToast({ message: error.message || uiConfig.gameLobby.scannerError, type: 'error' }));
    } finally {
      setIsProcessingMove(false);
    }
  };

  const confirmAttempt = async () => {
    if (!activeDefense || attemptPreview === null || activeDefense.revealedCells.includes(attemptPreview)) {
      dispatch(showToast({ message: uiConfig.gameLobby.selectClosedCell, type: 'error' }));
      return;
    }

    const moveCompleted = await handleCellClick(attemptPreview);
    if (!moveCompleted) return;

    setAttemptPreview(null);
    setActiveTool(null);
    if (defenseId) socketService.updateToolPreview(defenseId, null);
  };

  // Confirm radar placement
  const confirmRadar = async () => {
    if (!defenseId || !activeDefense || isProcessingMove || !radarPreview) return;

    try {
      setIsProcessingMove(true);
      // Pass radar type in positions array: [type (0=row, 1=column), index]
      const radarData = [radarPreview.type === 'row' ? 0 : 1, radarPreview.index];
      const result = await socketService.makeMove(defenseId, 'RADAR', radarPreview.index, radarData);
      dispatch(setLastMoveResult(result));
      await loadDefense();
      setRadarPreview(null);
      setActiveTool(null);
      socketService.updateToolPreview(defenseId, null);
    } catch (error: any) {
      dispatch(showToast({ message: error.message || uiConfig.gameLobby.radarError, type: 'error' }));
    } finally {
      setIsProcessingMove(false);
    }
  };

  // Cancel tool selection
  const cancelTool = () => {
    setActiveTool(null);
    setAttemptPreview(null);
    setScannerPreview(null);
    setRadarPreview(null);
    if (defenseId && isAttackerRole) socketService.updateToolPreview(defenseId, null);
  };

  const placeTool = () => {
    if (activeTool === 'click') {
      void confirmAttempt();
    } else if (activeTool === 'radar') {
      void confirmScanner();
    } else if (activeTool === 'scanner') {
      void confirmRadar();
    }
  };

  const handleTakeHalf = async () => {
    if (!defenseId) return;
    try {
      await socketService.takeHalf(defenseId);
    } catch (error: any) {
      dispatch(showToast({ message: error.message || uiConfig.gameLobby.genericError, type: 'error' }));
    }
  };

  if (!activeDefense) return null;

  // Get config based on defense difficulty
  const gameConfig = getConfigByDifficulty(activeDefense.difficulty);
  const isDefender = activeDefense.creator.id === user?.id;
  const isAttackerRole = activeDefense.attacker?.id === user?.id;
  const isGameActive = activeDefense.status === 'IN_PROGRESS';
  const isWaiting = activeDefense.status === 'WAITING';
  const isFinished = activeDefense.status === 'FINISHED' && !isFinishingSequence;
  const isExpired = activeDefense.status === 'EXPIRED' || (activeDefense.status === 'WAITING' && new Date(activeDefense.expiresAt).getTime() <= Date.now());
  const isOwnMatch = isDefender || isAttackerRole;
  const resolvedWinnerId = activeDefense.winnerId ?? (activeDefense.result === 'ATTACKER_TOOK_HALF' ? activeDefense.attacker?.id : null);
  const currentUserWon = Boolean(isOwnMatch && user && resolvedWinnerId === user.id);
  const canAttack = isWaiting && !isDefender && user && !isExpired;
  const canMakeMove = isGameActive && isAttackerRole && !isProcessingMove && !isFinishingSequence;

  const attemptsLeft = Math.max(0, gameConfig.attempts - activeDefense.attemptsUsed);
  // The legacy API names these tool counters opposite to their UI names.
  const radarUsesLeft = Math.max(0, gameConfig.scanners - activeDefense.scannersUsed);
  const scannerUsesLeft = Math.max(0, gameConfig.radars - activeDefense.radarsUsed);
  const canTakeHalf = activeDefense.bombsFound >= 1 && isAttackerRole && isGameActive;

  // Calculate potential win - net profit is defender's bet (attacker gets their bet back + defender's bet)
  // No commission currently applied
  const potentialWin = activeDefense.bet;

  const getStatusBadge = () => {
    if (isExpired) {
      return (
        <Badge className={clsx(styles.statusBadge, { [styles.statusRefund]: isDefender })} variant={isDefender ? 'info' : 'warning'}>
          {isDefender ? uiConfig.common.refund : uiConfig.common.expired}
        </Badge>
      );
    }
    if (isWaiting) {
      return (
        <Badge className={styles.statusBadge} variant="info">
          {uiConfig.common.waitingForAttack}
        </Badge>
      );
    }
    if (isGameActive) {
      return (
        <Badge className={styles.statusBadge} variant="error">
          {uiConfig.common.attackInProgress}
        </Badge>
      );
    }
    if (isFinished) {
      if (!isOwnMatch) {
        return (
          <Badge className={styles.statusBadge} variant="info">
            {uiConfig.common.completed}
          </Badge>
        );
      }

      return (
        <Badge className={styles.statusBadge} variant={currentUserWon ? 'success' : 'error'}>
          {currentUserWon ? uiConfig.common.victory : uiConfig.common.loss}
        </Badge>
      );
    }
    return null;
  };

  const getHeaderInfo = () => {
    // A defense that expired before an attack refunds its creator's bet.
    if (isExpired && isDefender) {
      return { label: uiConfig.common.refund, variant: 'refund' as const, amount: activeDefense.bet, sign: '' };
    }

    if (isFinished && user && (isDefender || isAttackerRole)) {
      if (activeDefense.result === 'ATTACKER_TOOK_HALF') {
        const won = isAttackerRole;
        return {
          label: won ? uiConfig.common.victory : uiConfig.common.defeat,
          variant: won ? ('win' as const) : ('lose' as const),
          amount: Math.floor(activeDefense.bet / 2),
          sign: won ? '+' : '-',
        };
      }

      const won = activeDefense.winnerId === user.id;
      return {
        label: won ? uiConfig.common.victory : uiConfig.common.defeat,
        variant: won ? ('win' as const) : ('lose' as const),
        amount: activeDefense.bet,
        sign: won ? '+' : '-',
      };
    }

    // Only the player who can start an attack, or the current attacker,
    // sees the potential winnings.
    if (canAttack || (isGameActive && isAttackerRole)) {
      return { label: uiConfig.common.winnings, variant: 'potential' as const, amount: potentialWin, sign: '' };
    }

    return { label: uiConfig.common.bet, variant: 'neutral' as const, amount: activeDefense.bet, sign: '' };
  };

  const headerInfo = getHeaderInfo();
  // const finishedTime = isFinished ? formatRelativeTime(activeDefense.finishedAt) : isExpired ? formatRelativeTime(activeDefense.expiresAt) : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className={styles.lobby}>
        <header
          className={clsx(styles.header, {
            [styles.headerWaiting]: isWaiting && !isExpired,
            [styles.headerActive]: isGameActive,
            [styles.headerFinished]: isFinished && isOwnMatch && currentUserWon,
            [styles.headerLost]: isFinished && isOwnMatch && !currentUserWon,
            [styles.headerForeign]: isFinished && !isOwnMatch,
            [styles.headerExpired]: isExpired,
          })}>
          <div className={styles.playersRow}>
            <div
              className={clsx(styles.player, {
                [styles.playerWinner]: isFinished && resolvedWinnerId === activeDefense.creator.id,
                [styles.playerLoser]: isFinished && Boolean(resolvedWinnerId) && resolvedWinnerId !== activeDefense.creator.id,
              })}>
              <div className={clsx(styles.avatarWrap, { [styles['avatarWrap--owner']]: isDefender })}>
                <Avatar className={styles.creatorAvatar} src={activeDefense.creator.photoUrl} name={activeDefense.creator.firstName} size="lg" />
              </div>
              <div className={styles.playerInfo}>
                <span className={styles.playerName}>{activeDefense.creator.firstName || activeDefense.creator.username || uiConfig.common.defender}</span>
                <img className={styles.roleIcon} src={uiConfig.icons.defense} alt="" />
              </div>
            </div>

            <div className={clsx(styles.headerWin, styles[`headerWin--${headerInfo.variant}`])}>
              {!['win', 'lose', 'refund'].includes(headerInfo.variant) && <span className={styles.headerMetaLabel}>{headerInfo.label}</span>}
              <span className={styles.headerWinAmount}>
                <span className={styles.star}>{star()}</span>
                {headerInfo.sign}
                {headerInfo.amount}
              </span>
            </div>

            <div
              className={clsx(styles.player, styles.playerAttacker, {
                [styles.playerWinner]: isFinished && Boolean(activeDefense.attacker) && resolvedWinnerId === activeDefense.attacker?.id,
                [styles.playerLoser]: isFinished && Boolean(activeDefense.attacker) && Boolean(resolvedWinnerId) && resolvedWinnerId !== activeDefense.attacker?.id,
              })}>
              <div className={styles.playerInfo}>
                <span className={styles.playerName}>{activeDefense.attacker ? activeDefense.attacker.firstName || activeDefense.attacker.username || uiConfig.common.attacker : uiConfig.common.waiting}</span>
                <img className={clsx(styles.roleIcon, styles.attackerRoleIcon)} src={uiConfig.icons.attack} alt="" />
              </div>
              <div
                className={clsx(styles.avatarWrap, styles.attackerAvatarWrap, {
                  [styles['avatarWrap--owner']]: isAttackerRole,
                  [styles['avatarWrap--attacker-owner']]: isAttackerRole,
                })}>
                {activeDefense.attacker ? <Avatar src={activeDefense.attacker.photoUrl} name={activeDefense.attacker.firstName} size="lg" className={styles.attackerAvatar} /> : <div className={styles.emptyAvatar}>?</div>}
              </div>
            </div>
          </div>

          <div className={styles.headerMeta}>
            <div className={styles.headerStatus}>
              <div className={styles.statusValue}>
                {/* {(isFinished || isExpired) && finishedTime && <span className={styles.finishedTime}>{finishedTime}</span>} */}
                {getStatusBadge()}
              </div>
            </div>
            {isGameActive && activeDefense.moveDeadline && (
              <div className={styles.headerTimer}>
                <Timer endTime={new Date(activeDefense.moveDeadline).getTime()} type="countdown" onExpire={() => void loadDefense()} />
              </div>
            )}
          </div>
        </header>
        <div className={styles.infoItem}>
          <span className={styles.infoIcon}></span>
          <span>
            {uiConfig.gameLobby.findBombs(gameConfig.bombsCount)} <BombIcon />
          </span>
        </div>
        {/* Game Board */}
        <div className={styles.boardSection}>
          <GameBoard
            mode={isGameActive && isAttackerRole ? 'play' : 'view'}
            revealedCells={activeDefense.revealedCells}
            bombPositions={activeDefense.bombPositions || []}
            foundBombPositions={activeDefense.foundBombPositions || []}
            onCellClick={canMakeMove ? handleEmptyCellClick : undefined}
            // Translate UI tool names to the legacy socket protocol names.
            activeTool={activeTool === 'radar' ? 'scanner' : activeTool === 'scanner' ? 'radar' : activeTool}
            attemptPosition={attemptPreview}
            onAttemptPlaced={canMakeMove ? handleAttemptPreview : undefined}
            onScannerPlaced={canMakeMove ? handleScannerPreview : undefined}
            onRadarPlaced={canMakeMove ? handleRadarPreview : undefined}
            onRadarTypeToggle={canMakeMove ? toggleScannerType : undefined}
            onAttemptConfirmed={canMakeMove ? confirmAttempt : undefined}
            onScannerConfirmed={canMakeMove ? confirmScanner : undefined}
            onRadarConfirmed={canMakeMove ? confirmRadar : undefined}
            scannerPositions={scannerPreview || []}
            scannerResults={activeDefense.scannerResults || []}
            radarResult={radarPreview}
            radarResults={activeDefense.radarResults || []}
            disabled={!canMakeMove}
            completed={isFinished}
            revealFinishedBombs={revealFinishedBombs}
            fieldSize={gameConfig.fieldSize}
          />
          {canAttack && (
            <div className={styles.attackOverlay}>
              <Button color="error" size="lg" fullWidth loading={isAttacking} onClick={handleAttack}>
                {uiConfig.gameLobby.attack} {uiConfig.common.currency} {activeDefense.bet}
              </Button>
            </div>
          )}
        </div>
        {/* The attacker already has these counts in the interactive tool controls. */}
        {!isAttackerRole && (
          <div className={styles.gameInfo}>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>{uiConfig.gameLobby.attempts}</span>
                <span>
                  <img src={uiConfig.icons.attempt} alt="" /> {attemptsLeft}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>{uiConfig.gameLobby.radars}</span>
                <span>
                  <img src={uiConfig.icons.radar} alt="" /> {radarUsesLeft}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>{uiConfig.gameLobby.scanners}</span>
                <span>
                  <img src={uiConfig.icons.scanner} alt="" /> {scannerUsesLeft}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Active Game Info */}
        {isGameActive && (
          <div className={styles.gameInfo}>
            {/* Tools */}
            {isAttackerRole && (
              <div className={styles.tools}>
                <button
                  className={clsx(styles.tool, styles.toolRadar, { [styles.toolPlace]: activeTool === 'radar' })}
                  aria-label={activeTool === 'radar' ? uiConfig.common.place : undefined}
                  onClick={() => {
                    if (activeTool === 'radar') {
                      placeTool();
                    } else {
                      setActiveTool('radar');
                      setAttemptPreview(null);
                      setRadarPreview(null);
                      // The radar covers a movable 2x2 area.
                      const positions = [0, 1, gameConfig.fieldSize, gameConfig.fieldSize + 1];
                      setScannerPreview(positions);
                      socketService.updateToolPreview(activeDefense.id, { moveType: 'SCANNER', positions });
                    }
                  }}
                  disabled={radarUsesLeft <= 0 || isProcessingMove}>
                  {activeTool === 'radar' ? (
                    <span className={styles.toolPlaceLabel}>
                      <svg aria-hidden="true" viewBox="0 0 1600 1280">
                        <defs>
                          <linearGradient id="radar-check-gradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="10.8%" stopColor="#1d4ed8" stopOpacity="0.82" />
                            <stop offset="73.35%" stopColor="#60a5fa" stopOpacity="0.68" />
                          </linearGradient>
                        </defs>
                        <path fill="url(#radar-check-gradient)" d="M1575 310q0 40-28 68l-724 724l-136 136q-28 28-68 28t-68-28l-136-136L53 740q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 295l656-657q28-28 68-28t68 28l136 136q28 28 28 68" />
                      </svg>
                    </span>
                  ) : (
                    <>
                      <span className={styles.toolIcon}>
                        <img src={uiConfig.icons.radar} alt="" />
                      </span>
                      <span className={styles.toolName}>{uiConfig.gameLobby.radar}</span>
                      <span className={styles.toolCount}>{radarUsesLeft}</span>
                    </>
                  )}
                </button>
                <button
                  className={clsx(styles.tool, styles.toolAttempt, { [styles.toolPlace]: activeTool === 'click' })}
                  aria-label={activeTool === 'click' ? uiConfig.common.place : undefined}
                  onClick={() => {
                    if (activeTool === 'click') {
                      placeTool();
                    } else {
                      const firstClosedCell = Array.from({ length: gameConfig.fieldSize ** 2 }, (_, position) => position).find((position) => !activeDefense.revealedCells.includes(position)) ?? 0;
                      setActiveTool('click');
                      setScannerPreview(null);
                      setRadarPreview(null);
                      setAttemptPreview(firstClosedCell);
                      socketService.updateToolPreview(activeDefense.id, { moveType: 'CLICK', position: firstClosedCell });
                    }
                  }}
                  disabled={attemptsLeft <= 0 || isProcessingMove}>
                  {activeTool === 'click' ? (
                    <span className={styles.toolPlaceLabel}>
                      <svg aria-hidden="true" viewBox="0 0 1600 1280">
                        <defs>
                          <linearGradient id="attempt-check-gradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="11.43%" stopColor="#047857" stopOpacity="0.9" />
                            <stop offset="89.83%" stopColor="#34d399" stopOpacity="0.82" />
                          </linearGradient>
                        </defs>
                        <path fill="url(#attempt-check-gradient)" d="M1575 310q0 40-28 68l-724 724l-136 136q-28 28-68 28t-68-28l-136-136L53 740q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 295l656-657q28-28 68-28t68 28l136 136q28 28 28 68" />
                      </svg>
                    </span>
                  ) : (
                    <>
                      <span className={styles.toolIcon}>
                        <img src={uiConfig.icons.attempt} alt="" />
                      </span>
                      <span className={styles.toolName}>{uiConfig.gameLobby.attempt}</span>
                      <span className={styles.toolCount}>{attemptsLeft}</span>
                    </>
                  )}
                </button>
                <button
                  className={clsx(styles.tool, styles.toolScanner, { [styles.toolPlace]: activeTool === 'scanner' })}
                  aria-label={activeTool === 'scanner' ? uiConfig.common.place : undefined}
                  onClick={() => {
                    if (activeTool === 'scanner') {
                      placeTool();
                    } else {
                      setActiveTool('scanner');
                      setAttemptPreview(null);
                      setScannerPreview(null);
                      // The scanner starts on the first row.
                      setRadarPreview({ type: 'row', index: 0, bombCount: -1 });
                      socketService.updateToolPreview(activeDefense.id, { moveType: 'RADAR', radarType: 'row', index: 0 });
                    }
                  }}
                  disabled={scannerUsesLeft <= 0 || isProcessingMove}>
                  {activeTool === 'scanner' ? (
                    <span className={styles.toolPlaceLabel}>
                      <svg aria-hidden="true" viewBox="0 0 1600 1280">
                        <defs>
                          <linearGradient id="scanner-check-gradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="11.43%" stopColor="#8b11dd" />
                            <stop offset="89.83%" stopColor="#fd7cff" />
                          </linearGradient>
                        </defs>
                        <path fill="url(#scanner-check-gradient)" d="M1575 310q0 40-28 68l-724 724l-136 136q-28 28-68 28t-68-28l-136-136L53 740q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 295l656-657q28-28 68-28t68 28l136 136q28 28 28 68" />
                      </svg>
                    </span>
                  ) : (
                    <>
                      <span className={styles.toolIcon}>
                        <img src={uiConfig.icons.scanner} alt="" />
                      </span>
                      <span className={styles.toolName}>{uiConfig.gameLobby.scanner}</span>
                      <span className={styles.toolCount}>{scannerUsesLeft}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {/* <div className={styles.actions}>
          {canTakeHalf && (
            <Button color="warning" size="lg" fullWidth onClick={handleTakeHalf}>
              {uiConfig.gameLobby.collectHalf} {uiConfig.common.currency} {Math.floor(activeDefense.bet / 2)} (50%)
            </Button>
          )}
          {attemptPreview !== null || scannerPreview || radarPreview ? (
            <Button color="secondary" size="lg" fullWidth onClick={cancelTool}>
              {uiConfig.common.cancel}
            </Button>
          ) : isFinished || isExpired || isGameActive ? (
            <Button color="secondary" size="lg" fullWidth onClick={handleClose}>
              {uiConfig.common.close}
            </Button>
          ) : (
            <></>
          )}
        </div> */}
      </div>
    </Modal>
  );
};

export default GameLobby;
