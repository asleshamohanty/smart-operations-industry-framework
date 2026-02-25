-- Add Missing Columns to Existing Shipments Table
-- Run this if you already have a shipments table but missing columns

-- Check if shipments table exists and add missing columns
DO $$
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shipments' AND column_name = 'status') THEN
        ALTER TABLE shipments ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    END IF;
    
    -- Add weather_delay_days column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shipments' AND column_name = 'weather_delay_days') THEN
        ALTER TABLE shipments ADD COLUMN weather_delay_days INTEGER DEFAULT 0;
    END IF;
    
    -- Add weather_condition column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shipments' AND column_name = 'weather_condition') THEN
        ALTER TABLE shipments ADD COLUMN weather_condition VARCHAR(255) DEFAULT 'Unknown';
    END IF;
    
    -- Add disruption_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shipments' AND column_name = 'disruption_score') THEN
        ALTER TABLE shipments ADD COLUMN disruption_score DECIMAL(5,2) DEFAULT 0.0;
    END IF;
    
    -- Add impact_level column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shipments' AND column_name = 'impact_level') THEN
        ALTER TABLE shipments ADD COLUMN impact_level VARCHAR(50) DEFAULT 'minimal';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shipments' AND column_name = 'created_at') THEN
        ALTER TABLE shipments ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'shipments' AND column_name = 'updated_at') THEN
        ALTER TABLE shipments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    RAISE NOTICE 'Missing columns added to shipments table successfully';
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_shipments_project_id ON shipments(project_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_estimated_arrival ON shipments(estimated_arrival);

-- Enable RLS if not already enabled
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shipments' AND policyname = 'Allow all operations for shipments') THEN
        CREATE POLICY "Allow all operations for shipments" ON shipments
            FOR ALL USING (true);
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'shipments' 
ORDER BY ordinal_position;
