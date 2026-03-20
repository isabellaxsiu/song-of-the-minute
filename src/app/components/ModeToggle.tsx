interface ModeToggleProps {
  mode: 'radio' | 'custom';
  onModeChange: (mode: 'radio' | 'custom') => void;
  isDarkBackground: boolean;
}

export function ModeToggle({ mode, onModeChange, isDarkBackground }: ModeToggleProps) {
  return (
    <div className="absolute top-8 left-8 z-20">
      <div className={`backdrop-blur-md border rounded-full p-1 shadow-2xl flex ${
        isDarkBackground
          ? 'bg-white/5 border-white/15'
          : 'bg-white/10 border-white/20'
      }`}>
        <button
          onClick={() => onModeChange('radio')}
          className={`px-6 py-2 rounded-full transition-all duration-300 ${
            mode === 'radio'
              ? isDarkBackground
                ? 'bg-white/20 text-white shadow-lg'
                : 'bg-white/30 text-white shadow-lg'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          Radio
        </button>
        <button
          onClick={() => onModeChange('custom')}
          className={`px-6 py-2 rounded-full transition-all duration-300 ${
            mode === 'custom'
              ? isDarkBackground
                ? 'bg-white/20 text-white shadow-lg'
                : 'bg-white/30 text-white shadow-lg'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          Custom
        </button>
      </div>
    </div>
  );
}