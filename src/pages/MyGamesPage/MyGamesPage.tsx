import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import styles from './MyGamesPage.module.scss';
import MyGameCard from './MyGameCard';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { openGameLobby } from '@/redux/slices/ui.slice';
import { MyGamesTab, socketService } from '@/services/socket';
import { DefensePublic } from '@/types';
import { formatDateGroup, getLocalDateKey } from '@/utils/formatTime';

const PAGE_SIZE = 20;

const initialActiveCounts: Record<MyGamesTab, number> = {
  all: 0,
  attacks: 0,
  defenses: 0,
};

const getTabFromSearchParams = (searchParams: URLSearchParams): MyGamesTab => {
  const tab = searchParams.get('tab');
  return tab === 'attacks' || tab === 'defenses' ? tab : 'all';
};

const MyGamesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = getTabFromSearchParams(searchParams);
  const [games, setGames] = useState<DefensePublic[]>([]);
  const [total, setTotal] = useState(0);
  const [activeCounts, setActiveCounts] = useState(initialActiveCounts);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gamesRef = useRef<DefensePublic[]>([]);
  const requestIdRef = useRef(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadGames = useCallback(async (tab: MyGamesTab, offset: number, append: boolean) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const page = await socketService.getMyGames(tab, offset, PAGE_SIZE);
      if (requestId !== requestIdRef.current) return;

      const knownIds = new Set(gamesRef.current.map((game) => game.id));
      const nextGames = append
        ? [...gamesRef.current, ...page.items.filter((game) => !knownIds.has(game.id))]
        : page.items;
      gamesRef.current = nextGames;
      setGames(nextGames);
      setTotal(page.total);
      setHasMore(page.hasMore);
      setActiveCounts(page.activeCounts);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      console.error('Failed to load user games:', loadError);
      setError('Не удалось загрузить игры');
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    gamesRef.current = [];
    setGames([]);
    setTotal(0);
    setHasMore(true);
    void loadGames(activeTab, 0, false);

    return () => {
      requestIdRef.current += 1;
    };
  }, [activeTab, loadGames]);

  useEffect(() => {
    if (!user) return;

    const matchesTab = (defense: DefensePublic) => {
      if (activeTab === 'attacks') return defense.attacker?.id === user.id;
      if (activeTab === 'defenses') return defense.creator.id === user.id;
      return defense.creator.id === user.id || defense.attacker?.id === user.id;
    };

    const handleUpsert = (defense: DefensePublic) => {
      const current = gamesRef.current;
      const index = current.findIndex((game) => game.id === defense.id);
      const belongsInTab = matchesTab(defense);

      if (index === -1) {
        if (!belongsInTab) return;
        const next = [defense, ...current];
        gamesRef.current = next;
        setGames(next);
        setTotal((value) => value + 1);
        return;
      }

      if (!belongsInTab) {
        const next = current.filter((game) => game.id !== defense.id);
        gamesRef.current = next;
        setGames(next);
        setTotal((value) => Math.max(0, value - 1));
        return;
      }

      const next = [...current];
      next[index] = defense;
      gamesRef.current = next;
      setGames(next);
    };

    const handleRemoved = (defenseId: number) => {
      if (!gamesRef.current.some((game) => game.id === defenseId)) return;
      const next = gamesRef.current.filter((game) => game.id !== defenseId);
      gamesRef.current = next;
      setGames(next);
      setTotal((value) => Math.max(0, value - 1));
    };

    const handleReconnect = () => loadGames(activeTab, 0, false);

    socketService.on('defenseCreated', handleUpsert);
    socketService.on('defenseUpdated', handleUpsert);
    socketService.on('defenseRemoved', handleRemoved);
    socketService.on('reconnected', handleReconnect);

    return () => {
      socketService.off('defenseCreated', handleUpsert);
      socketService.off('defenseUpdated', handleUpsert);
      socketService.off('defenseRemoved', handleRemoved);
      socketService.off('reconnected', handleReconnect);
    };
  }, [activeTab, loadGames, user]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadGames(activeTab, games.length, true);
      },
      { rootMargin: '160px 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [activeTab, games.length, hasMore, isLoading, loadGames]);

  const handleTabChange = (tab: MyGamesTab) => {
    if (tab === activeTab) return;
    requestIdRef.current += 1;
    gamesRef.current = [];
    setGames([]);
    setTotal(0);
    setHasMore(true);
    setIsLoading(true);
    setError(null);
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  const pageSettings: Record<MyGamesTab, { title: string; icon: string }> = {
    all: { title: 'Мои игры', icon: '/controller.png' },
    attacks: { title: 'Мои атаки', icon: '/two-swords.webp' },
    defenses: { title: 'Мои защиты', icon: '/shield_small.webp' },
  };
  const page = pageSettings[activeTab];

  const tabs = [
    { id: 'all' as const, label: 'Все' },
    { id: 'attacks' as const, label: 'Мои атаки' },
    { id: 'defenses' as const, label: 'Мои защиты' },
  ];

  const groupedGames = useMemo(() => {
    const groups: Array<{ key: string; label: string; games: DefensePublic[] }> = [];

    games.forEach((game) => {
      const key = getLocalDateKey(game.createdAt);
      const currentGroup = groups[groups.length - 1];

      if (currentGroup?.key === key) {
        currentGroup.games.push(game);
      } else {
        groups.push({ key, label: formatDateGroup(game.createdAt), games: [game] });
      }
    });

    return groups;
  }, [games]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {page.title}
          <span className={styles[`titleCount--${activeTab}`]}>{total}</span>
          <img src={page.icon} alt="" />
        </h1>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={clsx(styles.tab, { [styles['tab--active']]: activeTab === tab.id })}
            onClick={() => handleTabChange(tab.id)}>
            <span>{tab.label}</span>
            {activeCounts[tab.id] > 0 && <span className={styles.tabBadge}>{activeCounts[tab.id]}</span>}
          </button>
        ))}
      </div>

      <motion.div
        className={styles.list}
        key={`${activeTab}-${games.length === 0 && isLoading ? 'loading' : 'content'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        aria-busy={isLoading}>
        {groupedGames.map((group) => (
          <section className={styles.dateGroup} key={group.key}>
            <h2 className={styles.dateHeading}>{group.label}</h2>
            <div className={styles.dateGames}>
              {group.games.map((defense) => (
                <MyGameCard
                  key={defense.id}
                  defense={defense}
                  currentUserId={user?.id}
                  onClick={() => dispatch(openGameLobby(defense.id))}
                />
              ))}
            </div>
          </section>
        ))}

        {!isLoading && !error && games.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>&#127918;</span>
            <p className={styles.emptyText}>Нет игр</p>
            <p className={styles.emptyHint}>Создайте защиту или атакуйте противника</p>
          </div>
        )}

        {error && (
          <div className={styles.loadState}>
            <span>{error}</span>
            <button type="button" onClick={() => loadGames(activeTab, games.length, games.length > 0)}>
              Повторить
            </button>
          </div>
        )}

        {isLoading && <div className={styles.loader}>Загрузка…</div>}
        <div ref={loadMoreRef} className={styles.loadMoreTrigger} aria-hidden="true" />
      </motion.div>
    </div>
  );
};

export default MyGamesPage;
