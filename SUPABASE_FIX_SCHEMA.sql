-- Fix Supabase Database Schema
-- This script will drop and recreate tables with correct schemas

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS materials CASCADE;

-- Create materials table with correct schema
CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  import_location VARCHAR(255) NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verify materials table was created
SELECT 'Materials table created successfully' as status;

-- Create shipments table with correct schema
CREATE TABLE shipments (
  id SERIAL PRIMARY KEY,
  shipment_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
  material_type VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  estimated_arrival TIMESTAMP WITH TIME ZONE,
  actual_arrival TIMESTAMP WITH TIME ZONE,
  weather_delay_days INTEGER DEFAULT 0,
  weather_summary TEXT,
  disruption_score DECIMAL(3,2) DEFAULT 0.0,
  impact_level VARCHAR(50) DEFAULT 'minimal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verify shipments table was created
SELECT 'Shipments table created successfully' as status;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_materials_project_id ON materials(project_id);
CREATE INDEX IF NOT EXISTS idx_shipments_project_id ON shipments(project_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

-- Insert some sample data for testing (only if materials table exists)
INSERT INTO materials (name, quantity, unit, import_location, project_id) VALUES
('Steel', 100.0, 'tonnes', 'Mumbai, Maharashtra, India', 1),
('Concrete', 50.0, 'cubic meters', 'Pune, Maharashtra, India', 1),
('Asphalt', 200.0, 'tonnes', 'Delhi, India', 2)
ON CONFLICT DO NOTHING;

-- Final verification - check table structures
SELECT 'Final verification:' as status;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('materials', 'shipments') 
ORDER BY table_name, ordinal_position;
