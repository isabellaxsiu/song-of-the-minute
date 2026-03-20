export interface Song {
  name: string;
  artist: string;
  spotifyId: string;
  previewUrl: string | null;
}

/**
 * Returns a placeholder song for a given minute when no DB data exists.
 */
export function getPlaceholderSong(minuteOfDay: number): Song {
  const hours = Math.floor(minuteOfDay / 60);
  const mins = minuteOfDay % 60;
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const timeStr = `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;

  return {
    name: `Song of ${timeStr}`,
    artist: 'Coming Soon',
    spotifyId: '',
    previewUrl: null,
  };
}
