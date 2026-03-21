import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
}

export function SongDisplay({ 
  selectedTimezone, 
  isPlaying, 
  mode,
  playingSongIndex,
  setPlayingSongIndex,
  currentViewIndex,
  setCurrentViewIndex,
  isDarkBackground
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
      
      // Get hour and minute in selected timezone
      const timeString = now.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
        timeZone: selectedTimezone,
      });
      
      const [hourStr, minuteStr] = timeString.split(':');
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      
      // Calculate minute of day (0-1439)
      const minuteOfDay = hour * 60 + minute;
      
      setCurrentSong(getSong(minuteOfDay));
      setActualCurrentMinute(minuteOfDay);
      
      // In radio mode, sync the index and trigger animation
      if (mode === 'radio') {
        const prevIndex = currentIndex;
        setCurrentIndex(minuteOfDay);
        
        // Set direction for animation
        if (minuteOfDay > prevIndex) {
          setDirection(1);
        } else if (minuteOfDay < prevIndex) {
          setDirection(-1);
        }
      }
    };

    updateSong();
    
    // Always track the current minute for the playing indicator
    // Calculate milliseconds until the next minute at HH:MM:00
    const now = new Date();
    const secondsUntilNextMinute = 60 - now.getSeconds();
    const msUntilNextMinute = secondsUntilNextMinute * 1000 - now.getMilliseconds();
    
    let interval: NodeJS.Timeout;
    
    // Set timeout to trigger exactly at the start of the next minute (HH:MM:00)
    const timeout = setTimeout(() => {
      updateSong();
      
      // Then set interval to update every minute (60000ms)
      interval = setInterval(updateSong, 60000);
    }, msUntilNextMinute);
    
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [selectedTimezone, mode, currentIndex]);

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
      // Go back to the playing song
      setCurrentIndex(playingSongIndex);
      setCurrentViewIndex(playingSongIndex);
    } else {
      // Go back to the current minute's song
      setCurrentIndex(actualCurrentMinute);
      setCurrentViewIndex(actualCurrentMinute);
    }
  };

  // Handle wheel scroll for custom mode - horizontal scrolling (touchpad gestures)
  const handleWheel = (e: React.WheelEvent) => {
    if (mode !== 'custom') return;
    
    e.preventDefault();
    
    // Throttle scroll events to prevent too rapid changes
    const currentTime = Date.now();
    if (currentTime - lastScrollTime.current < 400) return;
    lastScrollTime.current = currentTime;
    
    // Use deltaX for horizontal scrolling (touchpad left/right gestures)
    // Also support deltaY as fallback for users who scroll vertically
    const deltaX = e.deltaX;
    const deltaY = e.deltaY;
    
    // Add threshold to prevent accidental small movements
    const threshold = 15;
    
    // Prioritize horizontal scrolling if detected
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Swipe left (fingers move left) = next song (like swiping on touchscreen)
      if (deltaX > threshold) {
        handleNext();
      } else if (deltaX < -threshold) {
        handlePrevious();
      }
    } else {
      // Fallback to vertical scrolling
      // Scroll down = next song
      if (deltaY > threshold) {
        handleNext();
      } else if (deltaY < -threshold) {
        handlePrevious();
      }
    }
  };

  // Sync currentViewIndex when mode or timezone changes
  useEffect(() => {
    setCurrentViewIndex(currentIndex);
  }, [currentIndex, setCurrentViewIndex]);

  // Get songs for carousel
  const getPrevSong = () => getSong((currentIndex - 1 + 1440) % 1440);
  const getCurrentSong = () => mode === 'radio' ? currentSong : getSong(currentIndex);
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

  if (mode === 'custom') {
    // Determine if we should show "Back to current song" button
    let showBackButton = false;
    if (isPlaying && playingSongIndex !== null) {
      // If playing, show when center card is not the playing song
      showBackButton = currentIndex !== playingSongIndex;
    } else {
      // If not playing, show when center card is not the current minute's song
      showBackButton = currentIndex !== actualCurrentMinute;
    }
    
    // Determine button text
    const backButtonText = (isPlaying && playingSongIndex !== null) 
      ? "Back to current song" 
      : "Take me to song of the minute";
    
    return (
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-[900px] px-4 pb-4">
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
            className={`absolute left-0 z-30 p-2 rounded-full backdrop-blur-md border transition-all duration-200 ${
              isDarkBackground
                ? 'bg-white/5 border-white/15 hover:bg-white/10'
                : 'bg-white/10 border-white/20 hover:bg-white/20'
            }`}
            aria-label="Previous song"
          >
            <ChevronLeft className="w-5 h-5 text-white/90" />
          </button>

          {/* Carousel Container */}
          <div className="flex items-center justify-center gap-4 px-12">
            {/* Left Song Card (Staggered) */}
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
                  {isPlaying && playingSongIndex === (currentIndex - 1 + 1440) % 1440 && (
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <div className="w-1 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-3 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-4 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                      <div className="w-1 h-3 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '450ms' }}></div>
                    </div>
                  )}
                </div>
              </div>
            </motion.button>

            {/* Center Song Card */}
            <motion.div
              key={`center-${currentIndex}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 w-[300px] scale-100"
            >
              <div className={`backdrop-blur-md border rounded-2xl px-6 py-4 shadow-2xl ${
                isDarkBackground
                  ? 'bg-white/8 border-white/20'
                  : 'bg-white/10 border-white/20'
              }`}>
                <div className="text-center">
                  <div className="text-white/90 font-medium text-lg mb-1 truncate">
                    {getCurrentSong().name}
                  </div>
                  <div className="text-white/60 text-sm truncate">
                    {getCurrentSong().artist}
                  </div>
                  {isPlaying && playingSongIndex === currentIndex && (
                    <div className="mt-3 flex items-center justify-center gap-1">
                      <div className="w-1 h-3 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-4 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-5 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                      <div className="w-1 h-4 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '450ms' }}></div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Song Card (Staggered) */}
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
                  {isPlaying && playingSongIndex === (currentIndex + 1) % 1440 && (
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <div className="w-1 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-3 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-4 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                      <div className="w-1 h-3 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '450ms' }}></div>
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            className={`absolute right-0 z-30 p-2 rounded-full backdrop-blur-md border transition-all duration-200 ${
              isDarkBackground
                ? 'bg-white/5 border-white/15 hover:bg-white/10'
                : 'bg-white/10 border-white/20 hover:bg-white/20'
            }`}
            aria-label="Next song"
          >
            <ChevronRight className="w-5 h-5 text-white/90" />
          </button>
        </div>
      </div>
    );
  }

  // Radio mode - three song cards with automatic scrolling animation
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-[900px] px-4 pb-4">
      <div className="flex items-center justify-center gap-4">
        {/* Left Song Card (Staggered) - Animated */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={`radio-prev-${currentIndex}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 w-[200px] opacity-40 scale-90"
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
          </motion.div>
        </AnimatePresence>

        {/* Center Song Card - Animated */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={`radio-center-${currentIndex}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 w-[300px] scale-100"
          >
            <div className={`backdrop-blur-md border rounded-2xl px-6 py-4 shadow-2xl ${
              isDarkBackground
                ? 'bg-white/8 border-white/20'
                : 'bg-white/10 border-white/20'
            }`}>
              <div className="text-center">
                <div className="text-white/90 font-medium text-lg mb-1 truncate">
                  {currentSong.name}
                </div>
                <div className="text-white/60 text-sm truncate">
                  {currentSong.artist}
                </div>
                {isPlaying && (
                  <div className="mt-3 flex items-center justify-center gap-1">
                    <div className="w-1 h-3 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-4 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-5 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-1 h-4 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '450ms' }}></div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right Song Card (Staggered) - Animated */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={`radio-next-${currentIndex}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 w-[200px] opacity-40 scale-90"
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}