-- Create songs table to store song-to-minute mappings
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minute_of_day INTEGER NOT NULL UNIQUE CHECK (minute_of_day >= 0 AND minute_of_day < 1440),
  name TEXT NOT NULL,
  artist TEXT NOT NULL,
  spotify_id TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Songs are publicly readable
CREATE POLICY "Songs are viewable by everyone"
ON public.songs FOR SELECT
TO anon, authenticated
USING (true);

-- Create index on minute_of_day for fast lookups
CREATE INDEX idx_songs_minute_of_day ON public.songs (minute_of_day);