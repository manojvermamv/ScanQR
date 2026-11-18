import React from 'react';
import { QrCode, ScanLine, Clock, Settings } from 'lucide-react';
import { ScreenType, ThemeMode } from '../core/types.ts';
import { triggerHaptic } from '../core/haptics.ts';

interface BottomTabBarProps {
  currentScreen: ScreenType;
  theme: ThemeMode;
  historyCount: number;
  onSelectScreen: (screen: ScreenType) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentScreen,
  theme,
  historyCount,
  onSelectScreen,
}) => {
  const isLight = theme === 'light';

  const tabs: Array<{
    id: ScreenType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'generator', label: 'Generate', icon: QrCode },
    { id: 'scanner', label: 'Scan', icon: ScanLine },
    { id: 'favorites', label: 'History', icon: Clock, badge: historyCount },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Primary navigation"
      className={`shrink-0 border-t px-2 py-2 flex items-center justify-around gap-2 z-30 ${
        isLight
          ? 'bg-white border-zinc-200 text-zinc-600'
          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
      }`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentScreen === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (!isActive) {
                triggerHaptic('light');
                onSelectScreen(tab.id);
              }
            }}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl transition cursor-pointer relative ${
              isActive
                ? isLight
                  ? 'text-emerald-700 bg-emerald-50 font-semibold'
                  : 'text-emerald-400 bg-zinc-800/80 font-semibold'
                : isLight
                ? 'text-zinc-600 hover:bg-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span
                  className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold tabular-nums flex items-center justify-center ${
                    isActive
                      ? isLight
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-500 text-zinc-950'
                      : isLight
                      ? 'bg-zinc-200 text-zinc-800'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-none">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
