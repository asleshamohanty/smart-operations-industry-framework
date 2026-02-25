from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set
import json
import asyncio
from datetime import datetime

router = APIRouter()

# Store active connections
active_connections: Set[WebSocket] = set()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict):
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

@router.websocket("/ws/sensors")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    print(f"Client connected. Total connections: {len(manager.active_connections)}")
    
    # Send initial snapshot
    from backend.utils.sensor_simulator import get_sensor_snapshot, get_sensor_updates
    snapshot = get_sensor_snapshot()
    await manager.send_personal_message(snapshot, websocket)
    
    # Last update time
    last_update_time = asyncio.get_event_loop().time()
    update_interval = 5.0  # 5 seconds
    
    try:
        while True:
            current_time = asyncio.get_event_loop().time()
            
            # Listen for messages from client (ping/pong)
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                message = json.loads(data)
                
                if message.get('type') == 'ping':
                    await websocket.send_json({'type': 'pong', 'timestamp': datetime.now().isoformat()})
            except asyncio.TimeoutError:
                # No message received, continue
                pass
            
            # Send periodic updates
            if current_time - last_update_time >= update_interval:
                updates = get_sensor_updates()
                await manager.send_personal_message(updates, websocket)
                last_update_time = current_time
            
            # Keep connection alive
            await asyncio.sleep(0.1)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"Client disconnected. Total connections: {len(manager.active_connections)}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

async def broadcast_sensor_update(sensors: list):
    """
    Broadcast sensor updates to all connected clients
    Can be called from anomaly detection or other services
    """
    message = {
        'type': 'update',
        'sensors': sensors,
        'timestamp': datetime.now().isoformat()
    }
    await manager.broadcast(message)

