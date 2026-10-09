import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '@/components/common/Avatar';
import { uiConfig } from '@/config/ui.config';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { updateDefense } from '@/redux/slices/game.slice';
import { openGameLobby } from '@/redux/slices/ui.slice';
import { socketService } from '@/services/socket';
import { DefensePublic } from '@/types';
import styles from './DefenseAttackAlert.module.scss';

const ALERT_DURATION = 800000;

const DefenseAttackAlert: React.FC = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [attackedDefense, setAttackedDefense] = useState<DefensePublic | null>(null);

  useEffect(() => {
    if (!userId) return;

    const handleGameStarted = (defense: DefensePublic) => {
      if (defense.creator.id !== userId || defense.status !== 'IN_PROGRESS') return;

      dispatch(updateDefense(defense));
      setAttackedDefense(defense);
    };

    socketService.on('gameStarted', handleGameStarted);
    return () => socketService.off('gameStarted', handleGameStarted);
  }, [dispatch, userId]);

  useEffect(() => {
    if (!attackedDefense) return;

    const timer = window.setTimeout(() => setAttackedDefense(null), ALERT_DURATION);
    return () => window.clearTimeout(timer);
  }, [attackedDefense]);

  const handleOpenGame = () => {
    if (!attackedDefense) return;

    dispatch(openGameLobby(attackedDefense.id));
    setAttackedDefense(null);
  };

  const attackerName = attackedDefense?.attacker?.firstName || attackedDefense?.attacker?.username || uiConfig.common.attacker;

  return (
    <AnimatePresence>
      {attackedDefense && (
        <motion.button type="button" className={styles.alert} aria-label={uiConfig.defenseAttackAlert.openGame} initial={{ opacity: 0, x: -24, y: 12 }} animate={{ opacity: 1, x: 0, y: 0 }} exit={{ opacity: 0, x: -24, y: 12 }} transition={{ duration: 0.22, ease: 'easeOut' }} onClick={handleOpenGame}>
          <span className={styles.avatar}>
            <Avatar src={attackedDefense.attacker?.photoUrl} name={attackerName} size="sm" />
            <span className={styles.statusDot} />
          </span>

          <span className={styles.content}>
            <span className={styles.title}>{uiConfig.defenseAttackAlert.title}</span>
            <span className={styles.message}>{uiConfig.defenseAttackAlert.message(attackerName)}</span>
            <span className={styles.hint}>{uiConfig.defenseAttackAlert.hint}</span>
          </span>

          <span className={styles.arrow} aria-hidden="true">
            ›
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default DefenseAttackAlert;
