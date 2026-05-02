import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Trophy, Sparkles, PenLine, User } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home',   icon: Home,     path: '/' },
  { label: 'Ranks',  icon: Trophy,   path: '/leaderboard' },
  { label: 'Oracle', icon: Sparkles, path: '/oracle' },
  { label: 'Review', icon: PenLine,  path: '/write-review' },
  { label: 'Profile',icon: User,     path: '/profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  function isActive(path) {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
              aria-label={item.label}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  active ? 'text-primary' : 'text-gray-400'
                }`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? 'text-primary' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
