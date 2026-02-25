# Supabase Anomaly History Setup

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

## 2. Create Anomalies Table

Run the SQL script in `backend/supabase_anomaly_table.sql` in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase_anomaly_table.sql
```

## 3. Configure Environment Variables

Create a `.env` file in `frontend/vite-project/` with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/sensors
```

Replace `your-project.supabase.co` and `your-anon-key` with your actual Supabase credentials.

## 4. Test the Setup

1. Start the backend: `cd backend && python main.py`
2. Start the frontend: `cd frontend/vite-project && npm run dev`
3. Navigate to Digital Twin page
4. Check if anomalies are being stored in Supabase

## 5. Verify Data

Check your Supabase dashboard to see if anomalies are being inserted into the `anomalies` table.

## Troubleshooting

- Make sure your Supabase URL and key are correct
- Check browser console for any Supabase connection errors
- Verify the table was created successfully in Supabase
- Ensure RLS policies allow the operations you need
