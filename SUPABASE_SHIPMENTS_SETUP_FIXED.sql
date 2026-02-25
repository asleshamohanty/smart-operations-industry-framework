-- Shipments Database Setup for Supabase (Fixed Version)
-- Run these commands in your Supabase SQL editor

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS materials CASCADE;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create shipments table
CREATE TABLE shipments (
    id BIGSERIAL PRIMARY KEY,
    shipment_id VARCHAR(255) UNIQUE NOT NULL,
    project_id INTEGER NOT NULL,
    material_type VARCHAR(255) NOT NULL,
    quantity DECIMAL(15,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    estimated_arrival TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    weather_delay_days INTEGER DEFAULT 0,
    weather_condition VARCHAR(255) DEFAULT 'Unknown',
    disruption_score DECIMAL(5,2) DEFAULT 0.0,
    impact_level VARCHAR(50) DEFAULT 'minimal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create materials table
CREATE TABLE materials (
    id BIGSERIAL PRIMARY KEY,
    material_id VARCHAR(255) UNIQUE NOT NULL,
    project_id INTEGER NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    material_type VARCHAR(255) NOT NULL,
    quantity DECIMAL(15,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_cost DECIMAL(15,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    supplier VARCHAR(255),
    import_location VARCHAR(255),
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_shipments_project_id ON shipments(project_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_estimated_arrival ON shipments(estimated_arrival);
CREATE INDEX idx_materials_project_id ON materials(project_id);
CREATE INDEX idx_materials_status ON materials(status);

-- Enable Row Level Security (RLS)
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (Simplified for lighter security)
-- Allow all operations for authenticated users
CREATE POLICY "Allow all operations for shipments" ON shipments
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for materials" ON materials
    FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_shipments_updated_at 
    BEFORE UPDATE ON shipments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at 
    BEFORE UPDATE ON materials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created successfully
SELECT 'shipments table created successfully' as status;
SELECT 'materials table created successfully' as status;
