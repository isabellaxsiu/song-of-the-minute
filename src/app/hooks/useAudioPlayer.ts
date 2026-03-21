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

// Module-level state to avoid closure issues
let _wasPlaying = false;
let _ended = false;
let _fallbackTimer: ReturnType<typeof setTimeout> | null = null;
let _setIsActuallyPlaying: ((v: boolean) => void) | null = null;
let _onPlaybackEnd: (() => void) | null = null;

function clearFallback() {
  if (_fallbackTimer) {
    clearTimeout(_fallbackTimer);
    _fallbackTimer = null;
  }
}

function fireEnded() {
  if (_ended) return;
  _ended = true;
  _wasPlaying = false;
  clearFallback();
  _setIsActuallyPlaying?.(false);
  _onPlaybackEnd?.();
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
  const pendingPlayRef = useRef<string | null>(null);

  // Keep module-level setter in sync
  _setIsActuallyPlaying = setIsActuallyPlaying;

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
      if (pendingPlayRef.current) {
        const spotifyId = pendingPlayRef.current;
        pendingPlayRef.current = null;
        initController(IFrameAPI, spotifyId);
      }
    };

    document.body.appendChild(script);

    return () => {
      clearFallback();
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

    if (controllerRef.current) {
      controllerRef.current.destroy();
      controllerRef.current = null;
    }

    container.innerHTML = '';
    container.style.display = 'block';
    _wasPlaying = false;
    _ended = false;
    clearFallback();

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
            _wasPlaying = true;
            _ended = false;
            _setIsActuallyPlaying?.(true);
          } else if (isPaused && _wasPlaying && position > 0) {
            // Genuine end: was playing, now paused, position advanced
            fireEnded();
          }
        });

        controller.addListener('ready', () => {
          // Set fallback timer
          clearFallback();
          _ended = false;
          _fallbackTimer = setTimeout(() => {
            fireEnded();
          }, 29000);
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
      pendingPlayRef.current = spotifyId;
    }
  }, [initController]);

  const pause = useCallback(() => {
    clearFallback();
    _wasPlaying = false;
    _ended = false;
    if (controllerRef.current) {
      controllerRef.current.destroy();
      controllerRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.style.display = 'none';
      containerRef.current.innerHTML = '';
    }
    setCurrentTrackId(null);
    setIsActuallyPlaying(false);
  }, []);

  const onEnded = useCallback((cb: () => void) => {
    _onPlaybackEnd = cb;
  }, []);

  return { play, pause, onEnded, currentTrackId, isActuallyPlaying };
}
