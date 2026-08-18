import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'floating';
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ variant = 'icon', className = '', showLabel = false }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  if (variant === 'pill') {
    return (
      <button
        id="theme-toggle-pill-btn"
        onClick={toggleTheme}
        type="button"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:text-white'
            : 'bg-white border-neutral-250 text-neutral-750 hover:bg-neutral-100 hover:text-neutral-900 shadow-xs'
        } ${className}`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 animate-in fade-in zoom-in duration-200" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 animate-in fade-in zoom-in duration-200" />
          )}
        </div>
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </button>
    );
  }

  if (variant === 'floating') {
    return (
      <button
        id="theme-toggle-floating-btn"
        onClick={toggleTheme}
        type="button"
        className={`p-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all active:scale-90 hover:scale-105 flex items-center justify-center ${
          isDark
            ? 'bg-neutral-900/90 border-neutral-750 text-amber-400 hover:text-amber-300 hover:bg-neutral-800'
            : 'bg-white/95 border-neutral-250 text-indigo-600 hover:text-indigo-700 hover:bg-neutral-50 shadow-neutral-300/40'
        } ${className}`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform duration-200 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 transition-transform duration-200 -rotate-12 hover:rotate-0" />
        )}
      </button>
    );
  }

  // Default 'icon' button for headers and toolbars
  return (
    <button
      id="theme-toggle-icon-btn"
      onClick={toggleTheme}
      type="button"
      className={`relative flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
        isDark
          ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white'
          : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 shadow-xs'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45 duration-200" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 transition-transform -rotate-12 hover:rotate-0 duration-200" />
        )}
      </div>
      {showLabel && (
        <span className="hidden md:inline font-medium">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
