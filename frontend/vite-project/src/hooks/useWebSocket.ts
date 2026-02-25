import { useEffect, useRef, useState } from 'react';
import { WebSocketMessage } from '@/types/sensor3d';
import { useSensorStore } from '@/state/sensors';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/sensors';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 30000;
const HEARTBEAT_INTERVAL = 15000;

interface UseWebSocketOptions {
  enabled?: boolean;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { enabled = true } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectDelay, setReconnectDelay] = useState(RECONNECT_DELAY);
  const { setSensors, updateSensors } = useSensorStore();

  const connect = () => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectDelay(RECONNECT_DELAY); // Reset backoff
        
        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, HEARTBEAT_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'snapshot':
              if (message.sensors) {
                setSensors(message.sensors);
              }
              break;
            case 'update':
              if (message.sensors) {
                updateSensors(message.sensors);
              }
              break;
            case 'pong':
              // Heartbeat response
              break;
            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        
        // Reconnect with exponential backoff
        const delay = Math.min(reconnectDelay * 1.5, MAX_RECONNECT_DELAY);
        setReconnectDelay(delay);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Reconnecting in ${delay}ms...`);
          connect();
        }, delay);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  };

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [enabled]);

  return { isConnected };
};

