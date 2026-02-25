-- Simple Step-by-Step Supabase Fix
-- Run each section separately if needed

-- Step 1: Check if projects table exists and has data
SELECT 'Checking projects table...' as status;
SELECT COUNT(*) as project_count FROM projects;

-- Step 2: Drop materials table if it exists
DROP TABLE IF EXISTS materials CASCADE;
SELECT 'Materials table dropped' as status;

-- Step 3: Create materials table
CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  import_location VARCHAR(255) NOT NULL,
  project_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Add foreign key constraint separately
ALTER TABLE materials 
ADD CONSTRAINT fk_materials_project_id 
FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE;

SELECT 'Materials table created successfully' as status;

-- Step 5: Test inserting a material
INSERT INTO materials (name, quantity, unit, import_location, project_id) VALUES
('Test Steel', 50.0, 'tonnes', 'Mumbai, Maharashtra, India', 1);

SELECT 'Test material inserted successfully' as status;

-- Step 6: Verify materials table structure
SELECT 'Materials table structure:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'materials' 
ORDER BY ordinal_position;
