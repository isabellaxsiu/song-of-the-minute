import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Parse a song title to extract the minute of day (0–719 for AM).
 * Handles formats like "12:05am", "1:30 AM", "00:00", "Midnight 1238 AM", etc.
 */
function parseMinuteFromTitle(title: string, index: number): number | null {
  // Normalize
  const t = title.trim();

  // Special cases
  if (/zero o.clock/i.test(t) || /midnight/i.test(t) && /00:00|12:00/i.test(t)) {
    return 0; // midnight
  }

  // "Midnight 1238 AM" → 12:38
  const midnightMatch = t.match(/midnight\s*(\d{1,2})(\d{2})\s*am/i);
  if (midnightMatch) {
    const h = parseInt(midnightMatch[1]);
    const m = parseInt(midnightMatch[2]);
    const hour24 = h === 12 ? 0 : h;
    return hour24 * 60 + m;
  }

  // Try standard time patterns: "12:05 AM", "1:30AM", "12:05am", etc.
  // Also handles titles like "Psalm 12:11am" or "Lonely Hours at 12:42am"
  const timeMatch = t.match(/(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)?/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1]);
    const m = parseInt(timeMatch[2]);
    const period = (timeMatch[3] || "").replace(/\./g, "").toLowerCase();

    // If no AM/PM specified, try to infer from context
    if (period === "am" || period === "") {
      // Convert 12-hour to 24-hour for AM
      if (h === 12) h = 0;
    } else if (period === "pm") {
      if (h !== 12) h += 12;
    }

    const minuteOfDay = h * 60 + m;
    if (minuteOfDay >= 0 && minuteOfDay < 720) {
      return minuteOfDay;
    }
  }

  // Try "HH:MM" 24-hour format (like "00:00")
  const h24Match = t.match(/^(\d{2}):(\d{2})/);
  if (h24Match) {
    const h = parseInt(h24Match[1]);
    const m = parseInt(h24Match[2]);
    const minuteOfDay = h * 60 + m;
    if (minuteOfDay >= 0 && minuteOfDay < 720) {
      return minuteOfDay;
    }
  }

  return null;
}

async function getSpotifyToken(clientId: string, clientSecret: string): Promise<string> {
  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to get Spotify token: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  return data.access_token;
}

interface SpotifyTrack {
  track: {
    id: string;
    name: string;
    artists: { name: string }[];
  } | null;
}

async function fetchAllPlaylistTracks(
  token: string,
  playlistId: string
): Promise<SpotifyTrack[]> {
  const allTracks: SpotifyTrack[] = [];
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,artists(name))),next`;

  while (url) {
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Spotify API error: ${resp.status} ${text}`);
    }

    const data = await resp.json();
    allTracks.push(...data.items);
    url = data.next;
  }

  return allTracks;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
    const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const playlistId = "4yjIJEGKLxtWBYB9lKQlRF";

    // Get Spotify access token
    const token = await getSpotifyToken(clientId, clientSecret);

    // Fetch all tracks
    const tracks = await fetchAllPlaylistTracks(token, playlistId);
    console.log(`Fetched ${tracks.length} tracks from playlist`);

    // Parse and map tracks to minutes
    const songRows: { minute_of_day: number; name: string; artist: string; spotify_id: string }[] = [];
    const usedMinutes = new Set<number>();

    for (let i = 0; i < tracks.length; i++) {
      const item = tracks[i];
      if (!item.track) continue;

      const { id, name, artists } = item.track;
      const artistStr = artists.map((a) => a.name).join(", ");
      const minute = parseMinuteFromTitle(name, i);

      if (minute !== null && !usedMinutes.has(minute)) {
        usedMinutes.add(minute);
        songRows.push({
          minute_of_day: minute,
          name,
          artist: artistStr,
          spotify_id: id,
        });
      }
    }

    console.log(`Mapped ${songRows.length} songs to minutes`);

    // Upsert into database in batches
    const batchSize = 50;
    for (let i = 0; i < songRows.length; i += batchSize) {
      const batch = songRows.slice(i, i + batchSize);
      const { error } = await supabase
        .from("songs")
        .upsert(batch, { onConflict: "minute_of_day" });

      if (error) {
        console.error(`Batch upsert error at ${i}:`, error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalTracks: tracks.length,
        mappedSongs: songRows.length,
        minutes: songRows.map((s) => s.minute_of_day).sort((a, b) => a - b),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
