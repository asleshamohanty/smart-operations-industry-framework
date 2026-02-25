# CORS Error Troubleshooting Guide

## 🚨 CORS Error: "Cross-Origin Request Blocked"

This error occurs when the frontend can't connect to the backend. Here's how to fix it:

## 🔍 **Step 1: Check if Backend is Running**

### Test Backend Connection

Open your browser and go to:

- **API Root**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs

If you see a "This site can't be reached" error, the backend isn't running.

### Start the Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not done already)
pip install -r requirements.txt

# Create .env file with your credentials
# Copy from env.example and fill in your values
cp env.example .env
nano .env  # Edit with your actual credentials

# Start the backend
python main.py
```

You should see output like:

```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

## 🔧 **Step 2: Check Environment Variables**

Make sure your `.env` file contains:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_DB_PASSWORD=your-database-password
OPENWEATHER_API_KEY=your_openweathermap_api_key_here
```

## 🌐 **Step 3: Check Frontend Configuration**

### Verify API Base URL

Check `frontend/vite-project/src/lib/api-services.ts`:

```typescript
const API_BASE_URL = "http://localhost:8000";
```

### Check if Frontend is Running

```bash
# Navigate to frontend directory
cd frontend/vite-project

# Install dependencies
npm install

# Start the frontend
npm run dev
```

The frontend should be available at http://localhost:5173

## 🔄 **Step 4: Test API Endpoints**

### Test with curl (Command Line)

```bash
# Test root endpoint
curl http://localhost:8000

# Test health endpoint
curl http://localhost:8000/health

# Test projects endpoint
curl http://localhost:8000/projects
```

### Test with Browser

1. Go to http://localhost:8000/docs
2. You should see the FastAPI documentation
3. Try the `/projects` endpoint

## 🛠️ **Step 5: Common Fixes**

### Fix 1: Port Conflicts

If port 8000 is busy:

```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
python main.py --port 8001
```

### Fix 2: Database Connection Issues

If you see database errors:

1. Check your Supabase credentials in `.env`
2. Make sure you've created the database tables
3. Verify your Supabase project is active

### Fix 3: Missing Dependencies

```bash
# Reinstall all dependencies
pip install -r requirements.txt --force-reinstall
```

## 🚀 **Step 6: Complete Setup Commands**

### Backend Setup

```bash
cd backend

# 1. Install dependencies
pip install -r requirements.txt

# 2. Create environment file
cp env.example .env
# Edit .env with your actual credentials

# 3. Start backend
python main.py
```

### Frontend Setup

```bash
cd frontend/vite-project

# 1. Install dependencies
npm install

# 2. Start frontend
npm run dev
```

## 🔍 **Step 7: Debug Information**

### Check Backend Logs

Look for these messages in your backend terminal:

```
INFO:     Started server process
INFO:     Waiting for application startup
INFO:     Application startup complete
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Check Frontend Console

Open browser developer tools (F12) and look for:

- Network errors in Console tab
- Failed requests in Network tab

## ✅ **Success Indicators**

When everything is working:

1. **Backend**: http://localhost:8000 shows API info
2. **Frontend**: http://localhost:5173 shows the app
3. **API Docs**: http://localhost:8000/docs shows all endpoints
4. **No CORS errors** in browser console

## 🆘 **Still Having Issues?**

### Check These Common Problems:

1. **Firewall**: Windows/Mac firewall blocking connections
2. **Antivirus**: Antivirus software blocking localhost
3. **VPN**: VPN software interfering with localhost
4. **Port conflicts**: Another service using port 8000
5. **Environment variables**: Missing or incorrect credentials

### Alternative Testing:

```bash
# Test with different ports
python main.py --port 8001
# Update frontend API_BASE_URL to http://localhost:8001
```

### Get Help:

1. Check the terminal output for error messages
2. Look at browser console for detailed error info
3. Verify all environment variables are set correctly
4. Make sure both frontend and backend are running simultaneously
