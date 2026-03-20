import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getPlaceholderSong, type Song } from '../data/songData';

// In-memory cache shared across all hook instances
const songCache = new Map<number, Song>();
let allSongsLoaded = false;

/**
 * Hook that loads all songs from the database once,
 * then provides a synchronous lookup by minute.
 */
export function useSongs() {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (allSongsLoaded || loadedRef.current) return;
    loadedRef.current = true;

    async function loadAll() {
      // Fetch all songs (should be ≤720 rows for AM)
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
    }

    loadAll();
  }, []);

  const getSong = useCallback((minuteOfDay: number): Song => {
    return songCache.get(minuteOfDay) ?? getPlaceholderSong(minuteOfDay);
  }, []);

  return { getSong };
}
