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
 * Uses a 29-second timer to detect preview end since Spotify's
 * playback_update events are unreliable for end detection.
 */
export function useAudioPlayer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const iframeAPIRef = useRef<SpotifyIFrameAPI | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false);
  const pendingPlayRef = useRef<string | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPlaybackEndRef = useRef<(() => void) | null>(null);

  const clearEndTimer = useCallback(() => {
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
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
      clearEndTimer();
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
    clearEndTimer();

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

        controller.addListener('ready', () => {
          setIsActuallyPlaying(true);
          
          // Start 29-second end timer
          clearEndTimer();
          endTimerRef.current = setTimeout(() => {
            setIsActuallyPlaying(false);
            onPlaybackEndRef.current?.();
          }, 29000);
          
          controller.play();
        });

        controller.addListener('playback_update', (data: any) => {
          if (!data?.data) return;
          const { isPaused } = data.data;
          if (isPaused) {
            clearEndTimer();
            setIsActuallyPlaying(false);
          } else {
            setIsActuallyPlaying(true);
          }
        });
      }
    );
  }, [clearEndTimer]);

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
    clearEndTimer();
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
  }, [clearEndTimer]);

  const onEnded = useCallback((cb: () => void) => {
    onPlaybackEndRef.current = cb;
  }, []);

  return { play, pause, onEnded, currentTrackId, isActuallyPlaying };
}
