import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { FloatingAIButton } from './FloatingAIButton';

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  // Hide FAB on Food and Activities pages
  const showFab = location.pathname !== '/food' && location.pathname !== '/activities';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-xl overflow-hidden relative">
        {children}
        {showFab && <FloatingAIButton />}
        <BottomNav />
      </main>
    </div>
  );
};