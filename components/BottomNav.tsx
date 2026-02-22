import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-40">
      <div className="flex justify-between items-center px-2 py-1 max-w-md mx-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-2 transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <item.icon className="w-6 h-6 mb-1" strokeWidth={2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
