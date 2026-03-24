import { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { TimeDisplay } from './components/TimeDisplay';
import { SongDisplay } from './components/SongDisplay';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useSongs } from './hooks/useSongs';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gradientColors, setGradientColors] = useState({ from: '', to: '' });
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  });
  const mode = 'custom' as const;
  const [playingSongIndex, setPlayingSongIndex] = useState<number | null>(null);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [isDarkBackground, setIsDarkBackground] = useState(false);
  const { play, pause, onEnded, isActuallyPlaying } = useAudioPlayer();
  const { getSong } = useSongs();

  useEffect(() => {
    const updateGradient = () => {
      // Use the hour from the currently viewed song card
      const currentHour = Math.floor(currentViewIndex / 60);
      
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
  }, [currentViewIndex]);

  // Keep isPlaying in sync with actual Spotify playback state
  useEffect(() => {
    setIsPlaying(isActuallyPlaying);
    if (!isActuallyPlaying && playingSongIndex !== null) {
      // Playback stopped (ended or paused in embed)
      setPlayingSongIndex(null);
    }
  }, [isActuallyPlaying]);

  // Helper to get the minute index to play
  const getPlayMinute = (): number => {
    if (mode === 'custom') return currentViewIndex;
    // Radio mode: current minute
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
      hour: 'numeric', minute: 'numeric', hour12: false, timeZone: selectedTimezone,
    });
    const [h, m] = timeString.split(':').map(Number);
    return h * 60 + m;
  };

  const handleToggle = () => {
    if (isPlaying) {
      pause();
      setIsPlaying(false);
      setPlayingSongIndex(null);
    } else {
      const minute = getPlayMinute();
      const song = getSong(minute);
      if (song.spotifyId) {
        if (mode === 'custom') setPlayingSongIndex(minute);
        play(song.spotifyId);
        // Don't set isPlaying here — wait for isActuallyPlaying from the embed
      }
    }
  };

  const handleSongCardClick = (minuteIndex: number) => {
    pause();
    const song = getSong(minuteIndex);
    if (song.spotifyId) {
      setPlayingSongIndex(minuteIndex);
      play(song.spotifyId);
      // Don't set isPlaying here — wait for isActuallyPlaying from the embed
    }
  };


  return (
    <div className={`size-full flex flex-col items-center justify-center bg-gradient-to-br ${gradientColors.from} ${gradientColors.to} transition-colors duration-1000`}>
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-3xl" />
      
      {/* Time Display - top center on mobile, top right on desktop */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-20">
        <TimeDisplay 
          selectedTimezone={selectedTimezone}
          onTimezoneChange={setSelectedTimezone}
          isDarkBackground={isDarkBackground}
        />
      </div>

      {/* Center content: play button */}
      <div className="relative z-10 flex flex-col items-center">
        {(() => {
          const isOopsCard = getSong(currentViewIndex).artist === 'Coming Soon';
          return (
            <button
              onClick={isOopsCard ? undefined : handleToggle}
              className={`group ${isOopsCard ? 'cursor-default opacity-50' : ''}`}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              disabled={isOopsCard}
            >
              <div className={`backdrop-blur-md border rounded-full p-8 shadow-2xl transition-all duration-300 ${
                isOopsCard
                  ? isDarkBackground
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/10 border-white/15'
                  : isDarkBackground 
                    ? 'bg-white/10 border-white/20 hover:bg-white/15 hover:scale-110 active:scale-95' 
                    : 'bg-white/20 border-white/30 hover:bg-white/30 hover:scale-110 active:scale-95'
              }`}>
                {isPlaying && !isOopsCard ? (
                  <Pause className="size-16 text-white fill-white" />
                ) : (
                  <Play className="size-16 text-white fill-white" />
                )}
              </div>
            </button>
          );
        })()}
      </div>

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
        onSongCardClick={handleSongCardClick}
      />
    </div>
  );
}