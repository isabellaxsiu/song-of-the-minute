import { useEffect, useCallback, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getPlaceholderSong, type Song } from '../data/songData';

// In-memory cache shared across all hook instances
const songCache = new Map<number, Song>();
let allSongsLoaded = false;
let loadStarted = false;
const subscribers = new Set<() => void>();
let snapshot = 0;

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => { subscribers.delete(cb); };
}

function getSnapshot() {
  return snapshot;
}

function notifyAll() {
  snapshot++;
  subscribers.forEach(fn => fn());
}

async function loadAllSongs() {
  if (loadStarted) return;
  loadStarted = true;

  // Fetch all songs in batches to avoid the default 1000-row limit
  const allData: Array<{ minute_of_day: number; name: string; artist: string; spotify_id: string; preview_url: string | null }> = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error: batchError } = await supabase
      .from('songs')
      .select('minute_of_day, name, artist, spotify_id, preview_url')
      .order('minute_of_day')
      .range(from, from + batchSize - 1);

    if (batchError) {
      console.error('Failed to load songs:', batchError);
      loadStarted = false;
      return;
    }

    if (data) allData.push(...data);
    if (!data || data.length < batchSize) break;
    from += batchSize;
  }

  const data = allData;
  const error = null;

  if (error) {
    console.error('Failed to load songs:', error);
    loadStarted = false;
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
  notifyAll();
}

export function useSongs() {
  const version = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    if (!allSongsLoaded) loadAllSongs();
  }, []);

  const getSong = useCallback((minuteOfDay: number): Song => {
    return songCache.get(minuteOfDay) ?? getPlaceholderSong(minuteOfDay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const getRandomSongMinute = useCallback((): number => {
    const keys = Array.from(songCache.keys());
    if (keys.length === 0) return 0;
    return keys[Math.floor(Math.random() * keys.length)];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  return { getSong, getRandomSongMinute };
}
