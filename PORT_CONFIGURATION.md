# Backend Port Configuration

## Problem Solved

The frontend was using inconsistent hardcoded URLs (some using `localhost:8000`, others using `127.0.0.1:8000`), causing issues when switching between different backend ports.

## Solution

All frontend API calls now use a centralized configuration through environment variables.

## How to Switch Ports

### Option 1: Use the PowerShell Script (Windows)

```powershell
# Switch to port 8000
.\switch-port.ps1 8000

# Switch to port 8001
.\switch-port.ps1 8001
```

### Option 2: Manual Configuration

Create or edit `frontend/vite-project/.env`:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://localhost:8000/ws/sensors
```

For port 8001:

```
VITE_API_BASE_URL=http://127.0.0.1:8001
VITE_WS_URL=ws://localhost:8001/ws/sensors
```

## What Was Fixed

- ✅ ShipmentsPage.tsx - Now uses `API_BASE_URL` instead of hardcoded URLs
- ✅ MaterialWeatherStatus.tsx - Now uses `API_BASE_URL` instead of hardcoded URLs
- ✅ ResourcesPage.tsx - Now uses `API_BASE_URL` instead of hardcoded URLs
- ✅ DynamicMaterialsWithPresets.tsx - Now uses `API_BASE_URL` instead of hardcoded URLs
- ✅ All API calls are now centralized through `api-services.ts`

## Usage

1. Run the PowerShell script to switch ports: `.\switch-port.ps1 8000`
2. Start your backend on the desired port
3. Start your frontend - it will automatically connect to the correct port

No more port inconsistencies! 🎉
