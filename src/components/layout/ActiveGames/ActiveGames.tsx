import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import styles from './ActiveGames.module.scss';
import Avatar from '@/components/common/Avatar';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { openGameLobby } from '@/redux/slices/ui.slice';
import { addDefense, removeDefense, syncActiveDefenses, updateDefense } from '@/redux/slices/game.slice';
import { DefensePublic } from '@/types';
import Waiting from '@/components/common/Waiting/Waiting';
import { socketService } from '@/services/socket';

interface ActiveGameBadge {
  defense: DefensePublic;
  type: 'my_defense_waiting' | 'my_defense_attacked' | 'my_attack';
}

const ActiveGames: React.FC = () => {
  const dispatch = useAppDispatch();
  const { defenses } = useAppSelector((state) => state.game);
  const { user } = useAppSelector((state) => state.auth);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const synchronize = async () => {
      try {
        const activeDefenses = await socketService.getDefenses();
        dispatch(syncActiveDefenses(activeDefenses));
      } catch {
        // Authentication/socket connection may still be starting. The
        // connected event below will retry with a live connection.
      }
    };
    const handleCreated = (defense: DefensePublic) => dispatch(addDefense(defense));
    const handleUpdated = (defense: DefensePublic) => dispatch(updateDefense(defense));
    const handleRemoved = (defenseId: number) => dispatch(removeDefense(defenseId));

    socketService.on('connected', synchronize);
    socketService.on('defenseCreated', handleCreated);
    socketService.on('defenseUpdated', handleUpdated);
    socketService.on('defenseRemoved', handleRemoved);
    void synchronize();

    return () => {
      socketService.off('connected', synchronize);
      socketService.off('defenseCreated', handleCreated);
      socketService.off('defenseUpdated', handleUpdated);
      socketService.off('defenseRemoved', handleRemoved);
    };
  }, [dispatch]);

  // Filter active games for the current user
  const activeGames: ActiveGameBadge[] = [];

  if (user) {
    defenses.forEach((defense) => {
      // Skip expired defenses (time ran out)
      if (defense.status === 'WAITING' && new Date(defense.expiresAt).getTime() <= Date.now()) {
        return;
      }

      // Never leave a dead active-game badge at 00:00 while the server is
      // finalizing the timeout or the socket is reconnecting.
      if (
        defense.status === 'IN_PROGRESS' &&
        (!defense.moveDeadline || new Date(defense.moveDeadline).getTime() <= Date.now())
      ) {
        return;
      }

      // My defense waiting for attack
      if (defense.creator.id === user.id && defense.status === 'WAITING') {
        activeGames.push({ defense, type: 'my_defense_waiting' });
      }
      // My defense being attacked
      else if (defense.creator.id === user.id && defense.status === 'IN_PROGRESS') {
        activeGames.push({ defense, type: 'my_defense_attacked' });
      }
      // I'm attacking someone
      else if (defense.attacker?.id === user.id && defense.status === 'IN_PROGRESS') {
        activeGames.push({ defense, type: 'my_attack' });
      }
    });
  }

  const handleBadgeClick = (defenseId: number) => {
    dispatch(openGameLobby(defenseId));
  };

  const formatTime = (dateString: string) => {
    const diff = new Date(dateString).getTime() - Date.now();
    if (diff <= 0) return '00:00';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (activeGames.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.slider} ref={scrollRef}>
        {activeGames.map(({ defense, type }) => (
          <motion.div key={defense.id} className={clsx(styles.badge, styles[`badge--${type}`])} onClick={() => handleBadgeClick(defense.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {type === 'my_defense_waiting' && (
              <>
                <div className={styles.avatarPlaceholder} />
                <span className={styles.time}>{formatTime(defense.expiresAt)}</span>
                {/* <motion.span className={styles.icon} animate={{ rotateX: [0, 180, 360] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}> */}
                <span role="img" aria-label="hourglass">
                  <Waiting />
                </span>
                {/* </motion.span> */}
              </>
            )}

            {type === 'my_defense_attacked' && (
              <>
                <Avatar src={defense.attacker?.photoUrl} name={defense.attacker?.firstName || defense.attacker?.username} size="xs" />
                <span className={styles.time}>{defense.moveDeadline ? formatTime(defense.moveDeadline) : '00:00'}</span>
                <motion.span className={styles.icon} animate={{ x: [0, 3, -3, 0], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                  <span role="img" aria-label="sword">
                    &#128481;&#65039;
                  </span>
                </motion.span>
              </>
            )}

            {type === 'my_attack' && (
              <>
                <Avatar src={defense.creator.photoUrl} name={defense.creator.firstName || defense.creator.username} size="xs" />
                <span className={styles.time}>{defense.moveDeadline ? formatTime(defense.moveDeadline) : '00:00'}</span>
                <motion.span className={styles.icon} animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                  <span role="img" aria-label="warning">
                    &#9888;&#65039;
                  </span>
                </motion.span>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ActiveGames;
