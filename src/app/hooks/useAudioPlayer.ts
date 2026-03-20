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
    // Use Spotify embed with autoplay
    iframeRef.current.src = `https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`;
    iframeRef.current.style.display = 'block';
    iframeRef.current.style.position = 'fixed';
    iframeRef.current.style.bottom = '0';
    iframeRef.current.style.left = '0';
    iframeRef.current.style.right = '0';
    iframeRef.current.style.width = '100%';
    iframeRef.current.style.height = '80px';
    iframeRef.current.style.zIndex = '50';
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
