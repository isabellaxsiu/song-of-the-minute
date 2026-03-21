import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getPlaceholderSong, type Song } from '../data/songData';

// In-memory cache shared across all hook instances
const songCache = new Map<number, Song>();
let allSongsLoaded = false;
// Listeners to notify when songs finish loading
const loadListeners = new Set<() => void>();

/**
 * Hook that loads all songs from the database once,
 * then provides a synchronous lookup by minute.
 */
export function useSongs() {
  const loadedRef = useRef(false);
  const [ready, setReady] = useState(allSongsLoaded);

  useEffect(() => {
    if (allSongsLoaded) {
      setReady(true);
      return;
    }

    // Subscribe to load completion
    const listener = () => setReady(true);
    loadListeners.add(listener);

    if (!loadedRef.current) {
      loadedRef.current = true;

      async function loadAll() {
        const { data, error } = await supabase
          .from('songs')
          .select('minute_of_day, name, artist, spotify_id, preview_url')
          .order('minute_of_day');

        if (error) {
          console.error('Failed to load songs:', error);
          return;
        }

        for (const row of data ?? []) {
          songCache.set(row.minute_of_day, {
            name: row.name,
            artist: row.artist,
            spotifyId: row.spotify_id,
            previewUrl: row.preview_url,
          });
        }
        allSongsLoaded = true;
        loadListeners.forEach(fn => fn());
        loadListeners.clear();
      }

      loadAll();
    }

    return () => { loadListeners.delete(listener); };
  }, []);

  const getSong = useCallback((minuteOfDay: number): Song => {
    return songCache.get(minuteOfDay) ?? getPlaceholderSong(minuteOfDay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return { getSong };
}
