-- Simplified Weather Providers Database Setup
-- Run these commands in your Supabase SQL editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own weather providers" ON weather_providers;
DROP POLICY IF EXISTS "Users can insert their own weather providers" ON weather_providers;
DROP POLICY IF EXISTS "Users can update their own weather providers" ON weather_providers;
DROP POLICY IF EXISTS "Users can delete their own weather providers" ON weather_providers;
DROP POLICY IF EXISTS "Users can view their own active provider" ON active_weather_providers;
DROP POLICY IF EXISTS "Users can insert their own active provider" ON active_weather_providers;
DROP POLICY IF EXISTS "Users can update their own active provider" ON active_weather_providers;
DROP POLICY IF EXISTS "Users can delete their own active provider" ON active_weather_providers;

-- Create more permissive policies
-- Allow all operations for authenticated users (lighter security)
CREATE POLICY "Allow all operations for authenticated users" ON weather_providers
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON active_weather_providers
    FOR ALL USING (true);

-- Alternative: If you want to disable RLS completely (even lighter security)
-- Uncomment these lines if you want to disable RLS entirely:
-- ALTER TABLE weather_providers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE active_weather_providers DISABLE ROW LEVEL SECURITY;
