import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './HomePage.module.scss';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { setDefenses, addDefense, updateDefense, removeDefense } from '@/redux/slices/game.slice';
import { socketService } from '@/services/socket';
import { DefensePublic } from '@/types';
import { uiConfig } from '@/config/ui.config';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { defenses } = useAppSelector((state) => state.game);

  useEffect(() => {
    const loadDefenses = async () => {
      try {
        const data = await socketService.getDefenses();
        dispatch(setDefenses(data));
      } catch (error) {
        console.error('Failed to load defenses:', error);
      }
    };

    if (defenses.length === 0) {
      loadDefenses();
    }

    const handleDefenseCreated = (defense: DefensePublic) => {
      dispatch(addDefense(defense));
    };

    const handleDefenseUpdated = (defense: DefensePublic) => {
      dispatch(updateDefense(defense));
    };

    const handleDefenseRemoved = (defenseId: number) => {
      dispatch(removeDefense(defenseId));
    };

    socketService.on('defenseCreated', handleDefenseCreated);
    socketService.on('defenseUpdated', handleDefenseUpdated);
    socketService.on('defenseRemoved', handleDefenseRemoved);
    socketService.on('reconnected', loadDefenses);

    return () => {
      socketService.off('defenseCreated', handleDefenseCreated);
      socketService.off('defenseUpdated', handleDefenseUpdated);
      socketService.off('defenseRemoved', handleDefenseRemoved);
      socketService.off('reconnected', loadDefenses);
    };
  }, [dispatch, defenses.length]);

  return (
    <div className={styles.page}>
      {/* Attack section - split into two buttons */}
      {/* <motion.div className={styles.attackSection} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className={styles.attackButtons}>
          <div className={styles.attackBtn} onClick={() => navigate('/games')}>
            <span className={styles.attackIcon}>&#9876;&#65039;</span>
            <div className={styles.attackText}>
              <span className={styles.attackTitle}>Список атак</span>
              <span className={styles.attackDesc}>Выбери цель</span>
            </div>
            {waitingDefensesCount > 0 && <span className={styles.counter}>{waitingDefensesCount}</span>}
          </div>
          <div className={styles.attackBtn} onClick={() => navigate('/search-attack')}>
            <span className={styles.attackIcon}>&#128269;</span>
            <div className={styles.attackText}>
              <span className={styles.attackTitle}>Поиск атаки</span>
              <span className={styles.attackDesc}>Автоподбор</span>
            </div>
          </div>
        </div>
      </motion.div> */}

      <motion.div className={styles.banner} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, ease: 'easeOut' }} onClick={() => navigate('/games')}>
        <div className={styles.bannerContent}>
          {/* <span className={styles.bannerIcon}>&#128737;&#65039;</span> */}
          <div className={styles.bannerText}>
            <h2 className={styles.bannerTitle}>{uiConfig.home.attackTitle}</h2>
            <p className={styles.bannerDesc}>{uiConfig.home.attackDescription}</p>
          </div>
        </div>
        <div className={`${styles.bannerArrow} ${styles.searchBannerArrow}`}>
          <img src={uiConfig.icons.police} alt="" />
        </div>
      </motion.div>

      <motion.div className={`${styles.banner} ${styles.bannerDefense}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, ease: 'easeOut' }} onClick={() => navigate('/create-defense')}>
        <div className={styles.bannerContent}>
          {/* <span className={styles.bannerIcon}>&#128737;&#65039;</span> */}
          <div className={styles.bannerText}>
            <h2 className={styles.bannerTitle}>{uiConfig.home.defenseTitle}</h2>
            <p className={styles.bannerDesc}>{uiConfig.home.defenseDescription}</p>
          </div>
        </div>
        <div className={`${styles.bannerArrow} ${styles.defenseBannerArrow}`}>
          <img src={uiConfig.icons.robber} alt="" />
        </div>
      </motion.div>

      {/* <motion.div className={styles.info} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
        <h3 className={styles.infoTitle}>{uiConfig.home.howToPlay}</h3>
        <div className={styles.infoList}>
          {uiConfig.home.steps.map((step, index) => (
            <div className={styles.infoItem} key={step}>
              <span className={styles.infoNumber}>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </motion.div> */}
    </div>
  );
};

export default HomePage;
