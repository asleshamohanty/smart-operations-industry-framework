export type Sensor3D = {
  id: string;
  name: string;
  type: string;
  unit: string;
  value: number;
  normalRange: [number, number];
  location: { x: number; y: number; z: number };
  status: 'normal' | 'anomaly';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  updatedAt: string;
};

export type WebSocketMessage = {
  type: 'snapshot' | 'update' | 'ping' | 'pong';
  sensors?: Sensor3D[];
  timestamp?: string;
};

