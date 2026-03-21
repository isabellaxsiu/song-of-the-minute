import { useRef, useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (IFrameAPI: SpotifyIFrameAPI) => void;
  }
}

interface SpotifyIFrameAPI {
  createController: (
    element: HTMLElement,
    options: { uri: string; width: string; height: string },
    callback: (controller: SpotifyEmbedController) => void
  ) => void;
}

interface SpotifyEmbedController {
  loadUri: (uri: string) => void;
  play: () => void;
  togglePlay: () => void;
  destroy: () => void;
  addListener: (event: string, callback: (data?: any) => void) => void;
}

/**
 * Hook that manages playback via Spotify's IFrame API.
 * Provides real playback state tracking (play/pause/ended).
 */
export function useAudioPlayer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const iframeAPIRef = useRef<SpotifyIFrameAPI | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false);
  const onPlaybackEndRef = useRef<(() => void) | null>(null);
  const pendingPlayRef = useRef<string | null>(null);
  const wasPlayingRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  const handlePlaybackEnded = () => {
    clearFallbackTimer();
    wasPlayingRef.current = false;
    setIsActuallyPlaying(false);
    onPlaybackEndRef.current?.();
  };

  useEffect(() => {
    // Create a hidden container for the Spotify embed
    const container = document.createElement('div');
    container.id = 'spotify-embed-container';
    container.style.position = 'fixed';
    container.style.bottom = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '80px';
    container.style.zIndex = '50';
    container.style.display = 'none';
    document.body.appendChild(container);
    containerRef.current = container;

    // Load Spotify IFrame API script
    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;

    window.onSpotifyIframeApiReady = (IFrameAPI) => {
      iframeAPIRef.current = IFrameAPI;
      // If there's a pending play request, execute it now
      if (pendingPlayRef.current) {
        const spotifyId = pendingPlayRef.current;
        pendingPlayRef.current = null;
        initController(IFrameAPI, spotifyId);
      }
    };

    document.body.appendChild(script);

    return () => {
      clearFallbackTimer();
      if (controllerRef.current) {
        controllerRef.current.destroy();
      }
      container.remove();
      script.remove();
      delete window.onSpotifyIframeApiReady;
    };
  }, []);

  const initController = useCallback((api: SpotifyIFrameAPI, spotifyId: string) => {
    const container = containerRef.current;
    if (!container) return;

    // Destroy existing controller
    if (controllerRef.current) {
      controllerRef.current.destroy();
      controllerRef.current = null;
    }

    // Clear container and reset state
    container.innerHTML = '';
    container.style.display = 'block';
    wasPlayingRef.current = false;
    clearFallbackTimer();

    // Create an element for the embed
    const embedEl = document.createElement('div');
    embedEl.id = 'spotify-embed';
    container.appendChild(embedEl);

    api.createController(
      embedEl,
      {
        uri: `spotify:track:${spotifyId}`,
        width: '100%',
        height: '80',
      },
      (controller) => {
        controllerRef.current = controller;

        controller.addListener('playback_update', (e: any) => {
          if (!e) return;
          const { isPaused, position } = e.data;

          if (!isPaused) {
            if (!wasPlayingRef.current) {
              // Playback just started — set fallback timer
              wasPlayingRef.current = true;
              clearFallbackTimer();
              fallbackTimerRef.current = setTimeout(() => {
                handlePlaybackEnded();
              }, 29000);
            }
            setIsActuallyPlaying(true);
          } else if (isPaused && wasPlayingRef.current) {
            // Transition from playing → paused = ended (regardless of position)
            handlePlaybackEnded();
          }
        });

        controller.addListener('ready', () => {
          controller.play();
        });
      }
    );
  }, []);

  const play = useCallback((spotifyId: string) => {
    if (!spotifyId) return;
    setCurrentTrackId(spotifyId);

    if (iframeAPIRef.current) {
      initController(iframeAPIRef.current, spotifyId);
    } else {
      // API not loaded yet, queue the play request
      pendingPlayRef.current = spotifyId;
    }
  }, [initController]);

  const pause = useCallback(() => {
    clearFallbackTimer();
    if (controllerRef.current) {
      controllerRef.current.destroy();
      controllerRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.style.display = 'none';
      containerRef.current.innerHTML = '';
    }
    wasPlayingRef.current = false;
    setCurrentTrackId(null);
    setIsActuallyPlaying(false);
  }, []);

  const onEnded = useCallback((cb: () => void) => {
    onPlaybackEndRef.current = cb;
  }, []);

  return { play, pause, onEnded, currentTrackId, isActuallyPlaying };
}
