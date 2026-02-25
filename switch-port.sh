#!/bin/bash

# Port Configuration Script
# Usage: ./switch-port.sh [8000|8001]

PORT=${1:-8000}

echo "Switching to port $PORT..."

# Create .env file in frontend directory
cat > frontend/vite-project/.env << EOF
VITE_API_BASE_URL=http://127.0.0.1:$PORT
VITE_WS_URL=ws://localhost:$PORT/ws/sensors
EOF

echo "✅ Frontend configured to use port $PORT"
echo "📝 Created frontend/vite-project/.env with:"
echo "   VITE_API_BASE_URL=http://127.0.0.1:$PORT"
echo "   VITE_WS_URL=ws://localhost:$PORT/ws/sensors"
echo ""
echo "🚀 Now start your backend on port $PORT and frontend will connect to it!"
