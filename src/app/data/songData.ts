export interface Song {
  name: string;
  artist: string;
  spotifyId: string;
}

/**
 * Real songs mapped to each minute of the day (0-1439).
 * Minutes 0-50 correspond to 12:00 AM - 12:50 AM, sourced from the
 * "Time of the Day (A.M.)" Spotify playlist.
 * Minutes without a mapped song will fall back to a placeholder.
 */
const songMap: Record<number, Song> = {
  // 12:00 AM
  0: { name: '00:00 (Zero O\'Clock)', artist: 'BTS', spotifyId: '6fqaMyg066xlukvUJWdM2T' },
  // 12:01 AM
  1: { name: '12:01 AM', artist: 'Lakim', spotifyId: '0lwAyzoyZ5PT5NQKKJFLNI' },
  // 12:02 AM
  2: { name: '12:02 A.M.', artist: 'Lil Bug', spotifyId: '1XdGKwLcSvwvMXyoBcMMZJ' },
  // 12:03 AM
  3: { name: '12:03 AM', artist: 'Into Misery, Nvr/Mnd', spotifyId: '2NlK1wHMDEyTsoB0idPvG8' },
  // 12:04 AM
  4: { name: '12:04 AM', artist: 'kris tofu', spotifyId: '38m5IBVmL1zEafbzwUmP7Y' },
  // 12:05 AM
  5: { name: '12:05am', artist: 'The Deli', spotifyId: '6IFEVo4pLKw67EYa1iEDle' },
  // 12:06 AM
  6: { name: '12:06 am', artist: 'Mc Culprit, Jade Cootes, Kid T', spotifyId: '4JQrkqW0LoUAJn7elsnprw' },
  // 12:07 AM
  7: { name: '12:07 AM', artist: 'Serenity Falls', spotifyId: '29ZJGHV6Jhp9DsTxvT1JQ2' },
  // 12:08 AM
  8: { name: '12:08 AM', artist: 'Euge Groove', spotifyId: '7wErXHP4sVOS35ni6H4ncQ' },
  // 12:09 AM
  9: { name: '12:09 am', artist: 'Lil Stallion', spotifyId: '5OCbUjjNy2ahzXbzGHjQga' },
  // 12:10 AM
  10: { name: '12:10 AM', artist: 'Book Cents Street Smarts', spotifyId: '2MTLPSivDbeVeugRXHrmQe' },
  // 12:11 AM
  11: { name: 'Psalm 12:11am', artist: 'LOVKN', spotifyId: '5FTSUs8c7VFseqG7MLBtfA' },
  // 12:12 AM
  12: { name: '12:12 Am', artist: 'artificial selection', spotifyId: '5ol4cfs7nqHPszFLgBpApZ' },
  // 12:13 AM
  13: { name: '12:13 am', artist: 'xPanda, Chill Select', spotifyId: '2R1UtiimYy5zjM4vKoVTwN' },
  // 12:14 AM
  14: { name: '12:14', artist: 'Mr Lofi', spotifyId: '6mCf4NZ1XHwU9SXGz44vLh' },
  // 12:15 AM
  15: { name: '12:15 AM', artist: 'jiffyLIX', spotifyId: '0HDLuoYgDw9JWWw57c8KUJ' },
  // 12:16 AM
  16: { name: '12:16 AM', artist: 'MERZ', spotifyId: '4qZTtz6onx7RIH8Wo8lVYS' },
  // 12:17 AM
  17: { name: '12:17 Am', artist: 'Zé Luis', spotifyId: '5XUyPNqZ1cTibJHPsB82jO' },
  // 12:18 AM
  18: { name: '12:18 AM', artist: 'Fae', spotifyId: '2Yyx3gmqqaXg0Arn39vdsy' },
  // 12:19 AM — no song in playlist, gap
  // 12:20 AM
  20: { name: '12:20 AM', artist: 'Jools', spotifyId: '3roR1a9oreC6Fo0GxLWLfa' },
  // 12:21 AM
  21: { name: 'Memo 1 (11 July 2020 12:21 am)', artist: 'Razegod', spotifyId: '4hxcy8f2WiU9OmGmbceUzc' },
  // 12:22 AM
  22: { name: '12:22am', artist: 'Feral Dogs', spotifyId: '0hds2ixAg5ttKasS0oF5wS' },
  // 12:23 AM
  23: { name: '12:23 AM', artist: 'C-Rxch', spotifyId: '2HpmnJD1wuhmEi1gfu0zjE' },
  // 12:24 AM
  24: { name: '12:24 AM', artist: 'Kid Zion', spotifyId: '4elHAoWy8dFRLuV5SLqnIc' },
  // 12:25 AM
  25: { name: '12:25 AM', artist: 'JeQuan Chill', spotifyId: '46Oo0xxI0T8fXD9PpoOKAF' },
  // 12:26 AM
  26: { name: '12:26 AM', artist: 'Llegó la Leche', spotifyId: '3ZdOkXLNgst7CaFMBPo7Oa' },
  // 12:27 AM
  27: { name: '12:27 A.M.', artist: '$plashious', spotifyId: '2ZVwMRPcjpPrCUXrM5EhA8' },
  // 12:28 AM
  28: { name: '12:28 AM', artist: 'Dann Zavala', spotifyId: '4WqKjkvPpL5BQmwLKCjjC9' },
  // 12:29 AM
  29: { name: '12:29AM', artist: 'Big Boss CG', spotifyId: '5K0cjeKnKEa16l48V2MHyK' },
  // 12:30 AM
  30: { name: '12:30 AM L8 Nite TV', artist: 'Crystal Cola', spotifyId: '7i67O4u3R4XdlmMfHmwScD' },
  // 12:31 AM
  31: { name: '12:31 A.M.', artist: 'Skinny Red', spotifyId: '6I34pJxUaiYHUaGfPdI0UC' },
  // 12:32 AM
  32: { name: '12:32 Am', artist: 'Carlos Shien', spotifyId: '1XvAjW5347BThkwM01nomz' },
  // 12:33 AM
  33: { name: '12:33 AM', artist: 'Serenity Falls', spotifyId: '7JKF84ZY977dE94qG8jGmF' },
  // 12:34 AM
  34: { name: '12:34 AM', artist: 'Billy Lemos, Omar Apollo, Maxwell Young', spotifyId: '16iNVfWKKZPDjctIcd0KMn' },
  // 12:35 AM
  35: { name: '12:35 Am', artist: 'Nørth.', spotifyId: '3q9XykFtckDaxhQeQUWfXE' },
  // 12:36 AM
  36: { name: '12:36am', artist: 'Caleb Hart', spotifyId: '2Zrv67hBxkgEYmR1OSZ5oW' },
  // 12:37 AM
  37: { name: '12:37 a.m.', artist: 'Mr Miller', spotifyId: '6Mif4skz00QbRlS1soq1z4' },
  // 12:38 AM
  38: { name: 'Midnight 1238 AM', artist: 'Gary McAvoy', spotifyId: '74K7uWarANgXEYkuKKXNY9' },
  // 12:39 AM
  39: { name: '12:39AM', artist: 'blkswan', spotifyId: '5dj8368j9seSE6efB7vJAn' },
  // 12:40 AM
  40: { name: '12:40am', artist: 'Doubb, Otto Almighty', spotifyId: '0BtNOw679U9JgOeNHncc7V' },
  // 12:41 AM
  41: { name: '12:41 AM', artist: 'Hotel Neon', spotifyId: '5uHFNdR9OcURFuYxzHXR40' },
  // 12:42 AM
  42: { name: 'Lonely Hours at 12:42am', artist: 'VOJayy', spotifyId: '0pCyZ6Lo0MTAInEkOvO1T2' },
  // 12:43 AM
  43: { name: '12:43 AM', artist: 'Dlux', spotifyId: '4ybJIQ10xMoZsrHgf0JnMH' },
  // 12:44 AM
  44: { name: '12:44am', artist: 'Sinewave Sionora', spotifyId: '4KfXFkIbJdAwcZxBvls0d1' },
  // 12:45 AM
  45: { name: '12:45 AM', artist: 'Pudditorium', spotifyId: '3eShi3n7Pnq5k9h7WBhOZA' },
  // 12:46 AM
  46: { name: '12:46 AM', artist: 'Nicko', spotifyId: '631fw57v3nEhRQnaP04A82' },
  // 12:47 AM
  47: { name: '12:47 AM', artist: 'YBK47', spotifyId: '0d9tGqhlYlPpfzEjWt4v54' },
  // 12:48 AM
  48: { name: '12:48 am', artist: 'Yefro', spotifyId: '727mZzGHWkPgQFWb0qx1yE' },
  // 12:49 AM
  49: { name: '12:49 AM', artist: 'Resolv\'d', spotifyId: '0WsurUKnZP7dF9sQCdULQ8' },
  // 12:50 AM
  50: { name: '12:50 AM', artist: 'Alexander Knight', spotifyId: '7ijrjYfEJqznaPVtdKTDOY' },
};

/**
 * Returns the song mapped to a given minute of the day (0-1439).
 * Falls back to a placeholder if no real song is mapped yet.
 */
export function getSongForMinute(minuteOfDay: number): Song {
  const mapped = songMap[minuteOfDay];
  if (mapped) return mapped;

  // Placeholder for minutes not yet mapped
  const hours = Math.floor(minuteOfDay / 60);
  const mins = minuteOfDay % 60;
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const timeStr = `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;

  return {
    name: `Song of ${timeStr}`,
    artist: 'Coming Soon',
    spotifyId: '',
  };
}
