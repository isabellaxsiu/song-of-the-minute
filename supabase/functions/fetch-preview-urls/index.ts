import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function getSpotifyToken(clientId: string, clientSecret: string): Promise<string> {
  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!resp.ok) throw new Error(`Token error: ${resp.status}`);
  const data = await resp.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
    const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new Error("Missing Spotify credentials");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = await getSpotifyToken(clientId, clientSecret);

    // Get all songs that need preview URLs
    const { data: songs, error } = await supabase
      .from("songs")
      .select("id, spotify_id")
      .not("spotify_id", "eq", "")
      .is("preview_url", null);

    if (error) throw error;
    if (!songs || songs.length === 0) {
      return new Response(JSON.stringify({ message: "All songs already have preview URLs", updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Fetching preview URLs for ${songs.length} songs`);

    let updated = 0;
    // Spotify allows up to 50 IDs per request
    for (let i = 0; i < songs.length; i += 50) {
      const batch = songs.slice(i, i + 50);
      const ids = batch.map((s) => s.spotify_id).join(",");

      const resp = await fetch(`https://api.spotify.com/v1/tracks?ids=${ids}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        console.error(`Spotify tracks API error: ${resp.status}`);
        continue;
      }

      const data = await resp.json();

      for (const track of data.tracks) {
        if (!track) continue;
        const song = batch.find((s) => s.spotify_id === track.id);
        if (!song) continue;

        const previewUrl = track.preview_url;
        if (previewUrl) {
          const { error: updateErr } = await supabase
            .from("songs")
            .update({ preview_url: previewUrl })
            .eq("id", song.id);

          if (!updateErr) updated++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, total: songs.length, updated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
