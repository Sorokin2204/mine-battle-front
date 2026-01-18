import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CreateDefensePage from './pages/CreateDefensePage';
import GamesPage from './pages/GamesPage';
import HistoryPage from './pages/HistoryPage';
import MyGamesPage from './pages/MyGamesPage';
import SearchAttackPage from './pages/SearchAttackPage';
import GameLobby from './components/pages/GameLobby';
import ResultModal from './components/pages/ResultModal';
import DevLoginModal from './components/pages/DevLoginModal';
import Toast from './components/common/Toast';
import { useAuth } from './hooks/useAuth';
import './styles/global.scss';

const AppContent: React.FC = () => {
  useAuth();

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="create-defense" element={<CreateDefensePage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="search-attack" element={<SearchAttackPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="my-games" element={<MyGamesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <GameLobby />
      <ResultModal />
      <DevLoginModal />
      <Toast />
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
