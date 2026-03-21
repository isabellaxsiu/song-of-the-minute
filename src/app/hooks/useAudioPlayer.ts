import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Hook that manages playback via a hidden Spotify embed iframe.
 * Uses Spotify's embed URL which allows playback for logged-in Spotify users.
 */
export function useAudioPlayer() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);

  useEffect(() => {
    // Create a hidden iframe for Spotify embeds
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.allow = 'encrypted-media; autoplay';
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    return () => {
      iframe.remove();
      iframeRef.current = null;
    };
  }, []);

  const play = useCallback((spotifyId: string) => {
    if (!spotifyId || !iframeRef.current) return;
    setCurrentTrackId(spotifyId);
    // Use Spotify embed with autoplay — keep iframe offscreen so audio plays without visible UI
    iframeRef.current.src = `https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0&autoplay=1`;
    iframeRef.current.style.display = 'block';
    iframeRef.current.style.position = 'fixed';
    iframeRef.current.style.width = '1px';
    iframeRef.current.style.height = '1px';
    iframeRef.current.style.left = '-9999px';
    iframeRef.current.style.top = '-9999px';
    iframeRef.current.style.opacity = '0';
    iframeRef.current.style.pointerEvents = 'none';
    iframeRef.current.style.border = 'none';
  }, []);

  const pause = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = '';
      iframeRef.current.style.display = 'none';
    }
    setCurrentTrackId(null);
  }, []);

  const onEnded = useCallback((_cb: () => void) => {
    // Spotify embed doesn't expose an ended event easily
    // The user will need to press pause manually
  }, []);

  return { play, pause, onEnded, currentTrackId };
}
