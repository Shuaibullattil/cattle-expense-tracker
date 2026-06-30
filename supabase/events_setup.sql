-- ====================================================================
-- SUPABASE SQL SETUP FOR THE EVENTS FEATURE
-- Run this script in the SQL Editor of your Supabase Dashboard
-- ====================================================================

-- 1. Create the events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (to allow safe re-runs)
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

-- 4. Create RLS Policies for authenticated users
CREATE POLICY "Users can view their own events" 
    ON public.events 
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events" 
    ON public.events 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" 
    ON public.events 
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" 
    ON public.events 
    FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- 5. Create index for faster querying
CREATE INDEX IF NOT EXISTS events_user_id_idx ON public.events(user_id);
CREATE INDEX IF NOT EXISTS events_animal_id_idx ON public.events(animal_id);
CREATE INDEX IF NOT EXISTS events_event_date_idx ON public.events(event_date DESC);
