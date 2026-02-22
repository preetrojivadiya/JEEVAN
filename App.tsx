import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Progress } from './pages/Progress';
import { Food } from './pages/Food';
import { Activities } from './pages/Activities';
import { Body } from './pages/Body';
import { Profile } from './pages/Profile';
import { AppProvider } from './context/AppContext';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/food" element={<Food />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/body" element={<Body />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
};

export default App;