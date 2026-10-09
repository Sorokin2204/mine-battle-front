import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './Layout.module.scss';
import Header from '../Header';
import BottomNav from '../BottomNav';
import DefenseAttackAlert from '../DefenseAttackAlert';

const Layout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <DefenseAttackAlert />
      <BottomNav />
    </div>
  );
};

export default Layout;
