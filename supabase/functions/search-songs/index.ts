import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  return (await resp.json()).access_token;
}

async function searchTrack(token: string, query: string): Promise<{ name: string; artist: string; spotify_id: string } | null> {
  const url = `https://api.spotify.com/v1/search?${new URLSearchParams({ q: query, type: "track", limit: "3" })}`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  
  if (resp.status === 429) {
    const wait = parseInt(resp.headers.get("Retry-After") || "5");
    await new Promise(r => setTimeout(r, wait * 1000));
    const retry = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!retry.ok) return null;
    const data = await retry.json();
    if (!data.tracks?.items?.length) return null;
    const t = data.tracks.items[0];
    return { name: t.name, artist: t.artists.map((a: any) => a.name).join(", "), spotify_id: t.id };
  }
  
  if (!resp.ok) return null;
  const data = await resp.json();
  if (!data.tracks?.items?.length) return null;
  const t = data.tracks.items[0];
  return { name: t.name, artist: t.artists.map((a: any) => a.name).join(", "), spotify_id: t.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { start, end } = await req.json();
    if (typeof start !== "number" || typeof end !== "number" || end - start > 30) {
      return new Response(JSON.stringify({ error: "Invalid range (max 30 minutes)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const clientId = Deno.env.get("SPOTIFY_CLIENT_ID")!;
    const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET")!;
    const token = await getSpotifyToken(clientId, clientSecret);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Check which minutes already have songs
    const { data: existing } = await supabase.from("songs").select("minute_of_day").gte("minute_of_day", start).lt("minute_of_day", end);
    const existingMinutes = new Set((existing || []).map(r => r.minute_of_day));

    const results: any[] = [];
    const notFound: number[] = [];

    for (let minute = start; minute < end; minute++) {
      if (existingMinutes.has(minute)) continue;

      const h24 = Math.floor(minute / 60);
      const mn = minute % 60;
      let h12 = h24 > 12 ? h24 - 12 : h24;
      if (h12 === 0) h12 = 12;
      const period = h24 >= 12 ? "pm" : "am";

      let track = await searchTrack(token, `"${h12}:${mn.toString().padStart(2, "0")}${period}"`);
      if (!track) {
        await new Promise(r => setTimeout(r, 500));
        track = await searchTrack(token, `"${h12}:${mn.toString().padStart(2, "0")} ${period.toUpperCase()}"`);
      }

      if (track) {
        results.push({ minute_of_day: minute, ...track });
      } else {
        notFound.push(minute);
      }
      await new Promise(r => setTimeout(r, 300));
    }

    // Insert found songs
    if (results.length > 0) {
      const { error } = await supabase.from("songs").upsert(results, { onConflict: "minute_of_day" });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ found: results.length, notFound: notFound.length, songs: results.map(r => `${r.minute_of_day}: ${r.name}`), missing: notFound }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
