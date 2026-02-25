-- Create Projects Table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  project_id INTEGER UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  project_budget DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  project_type VARCHAR(100) NOT NULL,
  description TEXT,
  estimated_duration_days INTEGER NOT NULL,
  team_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Materials Table
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

-- Create Shipments Table
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

-- Insert Sample Data
INSERT INTO projects (project_id, project_name, location, project_budget, currency, project_type, description, estimated_duration_days, team_size) VALUES
(1, 'Highway Construction', 'Mumbai', 5000000.00, 'USD', 'Infrastructure', 'Main highway construction project', 365, 50),
(2, 'Test Delhi', 'New Delhi', 100000000.00, 'USD', 'Construction', 'Test project for Delhi', 180, 5);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now)
CREATE POLICY "Allow all operations" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON materials FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON shipments FOR ALL USING (true);
