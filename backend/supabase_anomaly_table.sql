-- Create anomalies table for storing anomaly history
CREATE TABLE IF NOT EXISTS anomalies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anomaly_id TEXT UNIQUE NOT NULL,
    sensor_name TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    location TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    value DECIMAL NOT NULL,
    unit TEXT NOT NULL,
    normal_range_min DECIMAL NOT NULL,
    normal_range_max DECIMAL NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    confidence DECIMAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    description TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    project_id INTEGER,
    deviation_amount DECIMAL,
    deviation_percentage DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_anomalies_anomaly_id ON anomalies(anomaly_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_timestamp ON anomalies(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_anomalies_resolved ON anomalies(resolved);
CREATE INDEX IF NOT EXISTS idx_anomalies_project_id ON anomalies(project_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_sensor_name ON anomalies(sensor_name);

-- Enable Row Level Security (RLS)
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Allow public read access" ON anomalies FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON anomalies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON anomalies FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON anomalies FOR DELETE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_anomalies_updated_at 
    BEFORE UPDATE ON anomalies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
