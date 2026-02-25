# Supabase Setup Guide

## 🚀 Quick Start with Supabase

### 1. Create Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase in your project
supabase init

# Start local development (optional)
supabase start
```

### 2. Create Database Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Create Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    planned_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    planned_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_days INTEGER NOT NULL,
    labor_count INTEGER NOT NULL,
    labor_cost_per_day DECIMAL(10,2) NOT NULL,
    equipment_cost_per_day DECIMAL(10,2) NOT NULL,
    material VARCHAR(255) NOT NULL,
    material_quantity DECIMAL(10,2) NOT NULL,
    material_unit_cost DECIMAL(10,2) NOT NULL,
    planned_task_cost DECIMAL(15,2) NOT NULL,
    e_score DECIMAL(3,2) NOT NULL,
    s_score DECIMAL(3,2) NOT NULL,
    g_score DECIMAL(3,2) NOT NULL,
    carbon_footprint_kg DECIMAL(10,2) NOT NULL,
    water_usage_m3 DECIMAL(10,2) NOT NULL,
    energy_usage_kwh DECIMAL(10,2) NOT NULL,
    sdg_alignment_score DECIMAL(3,2) NOT NULL,
    predicted_delay_days INTEGER NOT NULL,
    predicted_task_cost DECIMAL(15,2) NOT NULL,
    predicted_esg_score DECIMAL(3,2) NOT NULL,
    profit_impact DECIMAL(10,2) NOT NULL,
    project_id INTEGER REFERENCES projects(project_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Weather Data table
CREATE TABLE weather_data (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(task_id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    weather_condition VARCHAR(50) NOT NULL,
    rain_mm DECIMAL(5,2) NOT NULL,
    temperature_c DECIMAL(5,2) NOT NULL,
    wind_speed_kmh DECIMAL(5,2) NOT NULL,
    weather_disruption_score DECIMAL(3,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_project_id ON projects(project_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_task_id ON tasks(task_id);
CREATE INDEX idx_weather_data_task_id ON weather_data(task_id);
CREATE INDEX idx_weather_data_date ON weather_data(date);

-- Enable Row Level Security (RLS) - Optional
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all operations on weather_data" ON weather_data FOR ALL USING (true);
```

### 3. Environment Variables

Copy the example environment file and fill in your credentials:

```bash
# Copy the example file
cp env.example .env

# Edit the .env file with your actual credentials
nano .env  # or use your preferred editor
```

The `.env` file should contain:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_DB_PASSWORD=your-database-password

# OpenWeatherMap API
OPENWEATHER_API_KEY=your_openweathermap_api_key_here
```

### 4. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_KEY`
5. Go to Settings → Database
6. Copy the **Database password** → `SUPABASE_DB_PASSWORD`

### 5. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 6. Run the Application

```bash
# Start the backend
python main.py

# The API will be available at http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

## 🔧 Supabase CLI Commands

### Project Management

```bash
# Create new project
supabase projects create "your-project-name"

# List all projects
supabase projects list

# Get project details
supabase projects get your-project-id
```

### Database Management

```bash
# Generate migration from schema changes
supabase db diff --schema public

# Apply migrations
supabase db push

# Reset database
supabase db reset

# Generate types for TypeScript
supabase gen types typescript --project-id your-project-id > types/supabase.ts
```

### Local Development

```bash
# Start local Supabase stack
supabase start

# Stop local Supabase stack
supabase stop

# View local dashboard
supabase dashboard
```

### Database Operations

```bash
# Connect to database
supabase db connect

# Run SQL file
supabase db sql --file schema.sql

# Backup database
supabase db dump --file backup.sql
```

## 📊 Supabase Dashboard Features

1. **Table Editor** - Visual table management
2. **SQL Editor** - Run custom queries
3. **API Documentation** - Auto-generated API docs
4. **Authentication** - User management (if needed)
5. **Storage** - File storage (if needed)
6. **Edge Functions** - Serverless functions (if needed)

## 🔒 Security Best Practices

1. **Enable RLS** on all tables
2. **Use environment variables** for sensitive data
3. **Set up proper policies** for data access
4. **Use service role key** only on server-side
5. **Monitor API usage** in dashboard

## 🚨 Troubleshooting

### Common Issues:

1. **Connection Error**: Check your database password and URL
2. **Table Not Found**: Run the SQL commands above
3. **Permission Denied**: Check RLS policies
4. **SSL Error**: Ensure SSL is enabled in connection string

### Debug Commands:

```bash
# Check connection
supabase db ping

# View logs
supabase logs

# Check status
supabase status
```
