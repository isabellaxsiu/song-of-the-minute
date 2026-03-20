import { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { TimeDisplay } from './components/TimeDisplay';
import { SongDisplay } from './components/SongDisplay';
import { ModeToggle } from './components/ModeToggle';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useSongs } from './hooks/useSongs';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gradientColors, setGradientColors] = useState({ from: '', to: '' });
  const [selectedTimezone, setSelectedTimezone] = useState<string>('UTC');
  const [mode, setMode] = useState<'radio' | 'custom'>('radio');
  const [playingSongIndex, setPlayingSongIndex] = useState<number | null>(null);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [isDarkBackground, setIsDarkBackground] = useState(false);

  useEffect(() => {
    const updateGradient = () => {
      // Get the hour in the selected timezone
      const hour = new Date().toLocaleString('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: selectedTimezone,
      });
      const currentHour = parseInt(hour);
      
      // Determine if it's a dark hour (late night/early morning)
      const isDark = currentHour >= 20 || currentHour <= 5;
      setIsDarkBackground(isDark);
      
      // Determine sky colors based on time of day - unique gradient for each hour
      let from, to;
      
      switch (currentHour) {
        case 0: // Midnight
          from = 'from-indigo-950';
          to = 'to-slate-900';
          break;
        case 1: // 1 AM
          from = 'from-slate-900';
          to = 'to-indigo-950';
          break;
        case 2: // 2 AM
          from = 'from-violet-950';
          to = 'to-indigo-900';
          break;
        case 3: // 3 AM
          from = 'from-indigo-900';
          to = 'to-violet-900';
          break;
        case 4: // 4 AM - Pre-dawn
          from = 'from-indigo-800';
          to = 'to-purple-800';
          break;
        case 5: // 5 AM - Early dawn
          from = 'from-purple-700';
          to = 'to-pink-600';
          break;
        case 6: // 6 AM - Dawn
          from = 'from-orange-300';
          to = 'to-pink-400';
          break;
        case 7: // 7 AM - Sunrise
          from = 'from-amber-300';
          to = 'to-orange-400';
          break;
        case 8: // 8 AM - Early morning
          from = 'from-sky-400';
          to = 'to-orange-300';
          break;
        case 9: // 9 AM - Morning
          from = 'from-sky-400';
          to = 'to-blue-300';
          break;
        case 10: // 10 AM
          from = 'from-cyan-400';
          to = 'to-blue-400';
          break;
        case 11: // 11 AM
          from = 'from-blue-400';
          to = 'to-sky-300';
          break;
        case 12: // Noon
          from = 'from-blue-400';
          to = 'to-cyan-300';
          break;
        case 13: // 1 PM
          from = 'from-sky-400';
          to = 'to-cyan-400';
          break;
        case 14: // 2 PM
          from = 'from-blue-400';
          to = 'to-cyan-400';
          break;
        case 15: // 3 PM
          from = 'from-blue-500';
          to = 'to-sky-400';
          break;
        case 16: // 4 PM
          from = 'from-blue-500';
          to = 'to-amber-300';
          break;
        case 17: // 5 PM - Early sunset
          from = 'from-orange-400';
          to = 'to-pink-400';
          break;
        case 18: // 6 PM - Sunset
          from = 'from-orange-500';
          to = 'to-purple-500';
          break;
        case 19: // 7 PM - Dusk
          from = 'from-amber-600';
          to = 'to-purple-600';
          break;
        case 20: // 8 PM - Early evening
          from = 'from-purple-700';
          to = 'to-indigo-800';
          break;
        case 21: // 9 PM - Evening
          from = 'from-indigo-800';
          to = 'to-purple-900';
          break;
        case 22: // 10 PM - Late evening
          from = 'from-indigo-900';
          to = 'to-slate-900';
          break;
        case 23: // 11 PM - Night
          from = 'from-slate-900';
          to = 'to-indigo-950';
          break;
        default:
          from = 'from-indigo-900';
          to = 'to-purple-900';
      }
      
      setGradientColors({ from, to });
    };

    updateGradient();
    // Update gradient every minute
    const interval = setInterval(updateGradient, 60000);
    
    return () => clearInterval(interval);
  }, [selectedTimezone]);

  const handleToggle = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    // In custom mode, when starting to play, set the playing song index to current view
    if (mode === 'custom' && newPlayingState) {
      setPlayingSongIndex(currentViewIndex);
    } else if (!newPlayingState) {
      // When pausing, clear the playing song index
      setPlayingSongIndex(null);
    }
  };

  const handleModeChange = (newMode: 'radio' | 'custom') => {
    setMode(newMode);
    // Pause when switching modes
    if (isPlaying) {
      setIsPlaying(false);
      setPlayingSongIndex(null);
    }
  };

  return (
    <div className={`size-full flex items-center justify-center bg-gradient-to-br ${gradientColors.from} ${gradientColors.to} transition-colors duration-1000`}>
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-3xl"></div>
      
      {/* Time Display */}
      <TimeDisplay 
        selectedTimezone={selectedTimezone}
        onTimezoneChange={setSelectedTimezone}
        isDarkBackground={isDarkBackground}
      />
      
      {/* Song Display */}
      <SongDisplay 
        selectedTimezone={selectedTimezone}
        isPlaying={isPlaying}
        mode={mode}
        playingSongIndex={playingSongIndex}
        setPlayingSongIndex={setPlayingSongIndex}
        currentViewIndex={currentViewIndex}
        setCurrentViewIndex={setCurrentViewIndex}
        isDarkBackground={isDarkBackground}
      />
      
      {/* Glass-effect button */}
      <button
        onClick={handleToggle}
        className="relative z-10 group"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <div className={`backdrop-blur-md border rounded-full p-8 shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 ${
          isDarkBackground 
            ? 'bg-white/10 border-white/20 hover:bg-white/15' 
            : 'bg-white/20 border-white/30 hover:bg-white/30'
        }`}>
          {isPlaying ? (
            <Pause className="size-16 text-white fill-white" />
          ) : (
            <Play className="size-16 text-white fill-white" />
          )}
        </div>
      </button>
      
      {/* Mode Toggle */}
      <ModeToggle
        mode={mode}
        onModeChange={handleModeChange}
        isDarkBackground={isDarkBackground}
      />
    </div>
  );
}