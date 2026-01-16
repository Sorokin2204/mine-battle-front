import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './Layout.module.scss';
import Header from '../Header';
import BottomNav from '../BottomNav';
import ActiveGames from '../ActiveGames';

const Layout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <Header />
      <ActiveGames />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
