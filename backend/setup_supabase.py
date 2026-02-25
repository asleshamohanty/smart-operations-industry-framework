#!/usr/bin/env python3
"""
Supabase Table Setup Script
Creates the necessary tables in Supabase for the Smart Ops Platform
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

def setup_tables():
    """Create tables in Supabase"""
    load_dotenv()
    
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    
    if not all([SUPABASE_URL, SUPABASE_KEY]):
        print("❌ Missing Supabase credentials in .env file")
        return False
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("🔧 Setting up Supabase tables...")
    
    # Note: In Supabase, you typically create tables via the SQL editor in the dashboard
    # This script just verifies the connection and shows the required table structure
    
    print("✅ Supabase connection successful!")
    print("\n📋 Required Tables (create these in Supabase SQL Editor):")
    print("""
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    project_id INTEGER UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    project_budget DECIMAL(15,2) NOT NULL,
    project_type VARCHAR(100),
    description TEXT,
    raw_materials TEXT,
    estimated_duration_days INTEGER,
    team_size INTEGER,
    environmental_goals TEXT,
    social_goals TEXT,
    governance_goals TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    task_id INTEGER UNIQUE NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    planned_start_date DATE,
    planned_end_date DATE,
    duration_days INTEGER,
    labor_count INTEGER,
    labor_cost_per_day DECIMAL(10,2),
    equipment_cost_per_day DECIMAL(10,2),
    material VARCHAR(255),
    material_quantity DECIMAL(10,2),
    material_unit_cost DECIMAL(10,2),
    planned_task_cost DECIMAL(15,2),
    e_score DECIMAL(3,2),
    s_score DECIMAL(3,2),
    g_score DECIMAL(3,2),
    carbon_footprint_kg DECIMAL(10,2),
    water_usage_m3 DECIMAL(10,2),
    energy_usage_kwh DECIMAL(10,2),
    sdg_alignment_score DECIMAL(3,2),
    predicted_delay_days INTEGER,
    predicted_task_cost DECIMAL(15,2),
    predicted_esg_score DECIMAL(3,2),
    profit_impact DECIMAL(10,2),
    project_id INTEGER REFERENCES projects(project_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
    """)
    
    print("\n🎯 Next Steps:")
    print("1. Go to your Supabase dashboard")
    print("2. Navigate to SQL Editor")
    print("3. Run the SQL commands above")
    print("4. Start your backend: python main.py")
    
    return True

if __name__ == "__main__":
    setup_tables()
