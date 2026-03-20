import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook that manages HTML5 Audio playback of Spotify 30-second preview clips.
 */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = 0.7;
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const play = useCallback((previewUrl: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.src !== previewUrl) {
      audio.src = previewUrl;
    }
    audio.play().catch((e) => console.warn('Playback blocked:', e));
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const onEnded = useCallback((cb: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.onended = cb;
  }, []);

  return { play, pause, onEnded };
}
