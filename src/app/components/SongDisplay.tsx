import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { type Song } from '../data/songData';
import { useSongs } from '../hooks/useSongs';
import { useIsMobile } from '../components/ui/use-mobile';

interface SongDisplayProps {
  selectedTimezone: string;
  isPlaying: boolean;
  mode: 'radio' | 'custom';
  playingSongIndex: number | null;
  setPlayingSongIndex: (index: number | null) => void;
  currentViewIndex: number;
  setCurrentViewIndex: (index: number) => void;
  isDarkBackground: boolean;
  onSongCardClick: (minuteIndex: number) => void;
}

export function SongDisplay({ 
  selectedTimezone, 
  isPlaying, 
  playingSongIndex,
  setPlayingSongIndex,
  currentViewIndex,
  setCurrentViewIndex,
  isDarkBackground,
  onSongCardClick
}: SongDisplayProps) {
  const { getSong } = useSongs();
  const isMobile = useIsMobile();
  const [currentSong, setCurrentSong] = useState<Song>({ name: '', artist: '', spotifyId: '', previewUrl: null });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actualCurrentMinute, setActualCurrentMinute] = useState(0);
  const [direction, setDirection] = useState(0);
  const lastScrollTime = useRef<number>(0);

  useEffect(() => {
    const updateSong = () => {
      const now = new Date();
      const timeString = now.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
        timeZone: selectedTimezone,
      });
      const [hourStr, minuteStr] = timeString.split(':');
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      const minuteOfDay = hour * 60 + minute;
      
      setCurrentSong(getSong(minuteOfDay));
      setActualCurrentMinute(minuteOfDay);
    };

    updateSong();
    
    const now = new Date();
    const secondsUntilNextMinute = 60 - now.getSeconds();
    const msUntilNextMinute = secondsUntilNextMinute * 1000 - now.getMilliseconds();
    
    let interval: NodeJS.Timeout;
    const timeout = setTimeout(() => {
      updateSong();
      interval = setInterval(updateSong, 60000);
    }, msUntilNextMinute);
    
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [selectedTimezone]);

  const handlePrevious = () => {
    setDirection(-1);
    const newIndex = (currentIndex - 1 + 1440) % 1440;
    setCurrentIndex(newIndex);
    setCurrentViewIndex(newIndex);
  };

  const handleNext = () => {
    setDirection(1);
    const newIndex = (currentIndex + 1) % 1440;
    setCurrentIndex(newIndex);
    setCurrentViewIndex(newIndex);
  };

  const handleBackToCurrentSong = () => {
    setDirection(0);
    if (isPlaying && playingSongIndex !== null) {
      setCurrentIndex(playingSongIndex);
      setCurrentViewIndex(playingSongIndex);
    } else {
      setCurrentIndex(actualCurrentMinute);
      setCurrentViewIndex(actualCurrentMinute);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const currentTime = Date.now();
    if (currentTime - lastScrollTime.current < 400) return;
    lastScrollTime.current = currentTime;
    
    const deltaX = e.deltaX;
    const deltaY = e.deltaY;
    const threshold = 15;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > threshold) handleNext();
      else if (deltaX < -threshold) handlePrevious();
    } else {
      if (deltaY > threshold) handleNext();
      else if (deltaY < -threshold) handlePrevious();
    }
  };

  useEffect(() => {
    setCurrentViewIndex(currentIndex);
  }, [currentIndex, setCurrentViewIndex]);

  const getPrevSong = () => getSong((currentIndex - 1 + 1440) % 1440);
  const getCurrentSong = () => getSong(currentIndex);
  const getNextSong = () => getSong((currentIndex + 1) % 1440);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : direction < 0 ? -100 : 0,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : direction < 0 ? 100 : 0,
      opacity: 0
    })
  };

  // Show "Back to current song" button when not viewing the current/playing song
  let showBackButton = false;
  if (isPlaying && playingSongIndex !== null) {
    showBackButton = currentIndex !== playingSongIndex;
  } else {
    showBackButton = currentIndex !== actualCurrentMinute;
  }
  
  const backButtonText = (isPlaying && playingSongIndex !== null) 
    ? "Back to current song" 
    : "Take me to song of the minute";

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-full max-w-[900px] px-4 pb-4">
      {/* Back to Current Song Button */}
      {showBackButton && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute -top-10 left-1/2 -translate-x-1/2"
        >
          <button
            onClick={handleBackToCurrentSong}
            className="text-white/70 text-sm hover:text-white/90 transition-colors duration-200"
          >
            {backButtonText}
          </button>
        </motion.div>
      )}
      
      <div className="relative flex items-center justify-center gap-4 py-4" onWheel={handleWheel}>
        {/* Left Arrow Button */}
        <button
          onClick={handlePrevious}
          className={`absolute -left-2 md:left-0 z-30 p-2 rounded-full transition-all duration-200 text-white ${
            isMobile
              ? 'hover:text-white/90'
              : isDarkBackground
                ? 'backdrop-blur-md bg-white/5 border border-white/15 hover:bg-white/10'
                : 'backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20'
          }`}
          aria-label="Previous song"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Carousel Container */}
        <div className="flex items-center justify-center gap-4 px-12">
          {/* Left Song Card - Hidden on mobile */}
          {!isMobile && (
            <motion.button
              key={`prev-${currentIndex}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              onClick={handlePrevious}
              className="flex-shrink-0 w-[200px] opacity-40 scale-90 hover:opacity-60 transition-opacity duration-300"
            >
              <div className={`backdrop-blur-md border rounded-2xl px-4 py-3 shadow-2xl ${
                isDarkBackground
                  ? 'bg-white/5 border-white/15'
                  : 'bg-white/10 border-white/20'
              }`}>
                <div className="text-center">
                  <div className="text-white/90 font-medium text-sm mb-1 truncate">
                    {getPrevSong().name}
                  </div>
                  <div className="text-white/60 text-xs truncate">
                    {getPrevSong().artist}
                  </div>
                </div>
              </div>
            </motion.button>
          )}

          {/* Center Song Card */}
          <motion.div
            key={`center-${currentIndex}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className={`flex-shrink-0 scale-100 ${isMobile ? 'w-[280px]' : 'w-[300px]'}`}
          >
            <div className={`backdrop-blur-md border rounded-2xl px-6 py-4 shadow-2xl ${
              isDarkBackground
                ? 'bg-white/8 border-white/20'
                : 'bg-white/10 border-white/20'
            }`}>
              <div className="text-center">
                <div className="text-white/90 font-medium mb-1" style={{ textWrap: 'balance', fontSize: getCurrentSong().name.length > 25 ? '0.875rem' : '1.125rem', lineHeight: getCurrentSong().name.length > 25 ? '1.25rem' : '1.75rem' }}>
                  {getCurrentSong().name}
                </div>
                <div className="text-white/60 text-sm" style={{ textWrap: 'balance' }}>
                  {getCurrentSong().artist}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Song Card - Hidden on mobile */}
          {!isMobile && (
            <motion.button
              key={`next-${currentIndex}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              onClick={handleNext}
              className="flex-shrink-0 w-[200px] opacity-40 scale-90 hover:opacity-60 transition-opacity duration-300"
            >
              <div className={`backdrop-blur-md border rounded-2xl px-4 py-3 shadow-2xl ${
                isDarkBackground
                  ? 'bg-white/5 border-white/15'
                  : 'bg-white/10 border-white/20'
              }`}>
                <div className="text-center">
                  <div className="text-white/90 font-medium text-sm mb-1 truncate">
                    {getNextSong().name}
                  </div>
                  <div className="text-white/60 text-xs truncate">
                    {getNextSong().artist}
                  </div>
                </div>
              </div>
            </motion.button>
          )}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={handleNext}
          className={`absolute -right-2 md:right-0 z-30 p-2 rounded-full transition-all duration-200 text-white ${
            isMobile
              ? 'hover:text-white/90'
              : isDarkBackground
                ? 'backdrop-blur-md bg-white/5 border border-white/15 hover:bg-white/10'
                : 'backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20'
          }`}
          aria-label="Next song"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
