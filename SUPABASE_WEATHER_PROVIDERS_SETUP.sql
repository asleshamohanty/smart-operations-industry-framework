-- Weather Providers Database Setup
-- Run these commands in your Supabase SQL editor

-- Create weather_providers table
CREATE TABLE IF NOT EXISTS weather_providers (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    base_url TEXT NOT NULL,
    key_param VARCHAR(100) NOT NULL,
    api_key TEXT NOT NULL,
    city_param VARCHAR(100) NOT NULL,
    temperature_path VARCHAR(255) NOT NULL,
    humidity_path VARCHAR(255) NOT NULL,
    description_path VARCHAR(255) NOT NULL,
    wind_speed_path VARCHAR(255),
    pressure_path VARCHAR(255),
    headers JSONB,
    method VARCHAR(10) DEFAULT 'GET',
    additional_params JSONB,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider_id)
);

-- Create active_providers table to track which provider is active for each user
CREATE TABLE IF NOT EXISTS active_weather_providers (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weather_providers_user_id ON weather_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_weather_providers_provider_id ON weather_providers(provider_id);
CREATE INDEX IF NOT EXISTS idx_active_providers_user_id ON active_weather_providers(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE weather_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_weather_providers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own weather providers
CREATE POLICY "Users can view their own weather providers" ON weather_providers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weather providers" ON weather_providers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weather providers" ON weather_providers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weather providers" ON weather_providers
    FOR DELETE USING (auth.uid() = user_id);

-- Active providers policies
CREATE POLICY "Users can view their own active provider" ON active_weather_providers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own active provider" ON active_weather_providers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active provider" ON active_weather_providers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own active provider" ON active_weather_providers
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_weather_providers_updated_at 
    BEFORE UPDATE ON weather_providers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_active_providers_updated_at 
    BEFORE UPDATE ON active_weather_providers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
