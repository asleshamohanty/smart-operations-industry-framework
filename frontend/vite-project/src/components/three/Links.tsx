import React from 'react';
import { Line } from '@react-three/drei';
import { Sensor3D } from '@/types/sensor3d';

interface LinksProps {
  sensors: Sensor3D[];
}

export const Links: React.FC<LinksProps> = ({ sensors }) => {
  // Define connections between related sensors
  const connections: [string, string][] = [];
  
  // Connect sensors that are related (e.g., weather sensors)
  const weatherSensors = sensors.filter(s => 
    s.type.includes('Temperature') || 
    s.type.includes('Rainfall') || 
    s.type.includes('Wind') ||
    s.type.includes('Weather')
  );
  
  for (let i = 0; i < weatherSensors.length - 1; i++) {
    connections.push([weatherSensors[i].id, weatherSensors[i + 1].id]);
  }
  
  // Connect ESG sensors
  const esgSensors = sensors.filter(s => 
    s.type.includes('Environmental') || 
    s.type.includes('Social') || 
    s.type.includes('Governance') ||
    s.type.includes('ESG')
  );
  
  for (let i = 0; i < esgSensors.length - 1; i++) {
    connections.push([esgSensors[i].id, esgSensors[i + 1].id]);
  }
  
  // Connect resource sensors
  const resourceSensors = sensors.filter(s => 
    s.type.includes('Carbon') || 
    s.type.includes('Water') || 
    s.type.includes('Energy')
  );
  
  for (let i = 0; i < resourceSensors.length - 1; i++) {
    connections.push([resourceSensors[i].id, resourceSensors[i + 1].id]);
  }
  
  // Create lines for each connection
  return (
    <>
      {connections.map(([fromId, toId], index) => {
        const fromSensor = sensors.find(s => s.id === fromId);
        const toSensor = sensors.find(s => s.id === toId);
        
        if (!fromSensor || !toSensor) return null;
        
        const hasAnomaly = fromSensor.status === 'anomaly' || toSensor.status === 'anomaly';
        const color = hasAnomaly ? '#ef4444' : '#22c55e';
        
        return (
          <Line
            key={`${fromId}-${toId}-${index}`}
            points={[
              [fromSensor.location.x, fromSensor.location.y, fromSensor.location.z],
              [toSensor.location.x, toSensor.location.y, toSensor.location.z]
            ]}
            color={color}
            lineWidth={hasAnomaly ? 2 : 1}
            transparent
            opacity={hasAnomaly ? 0.6 : 0.3}
            dashed={hasAnomaly}
            dashScale={hasAnomaly ? 50 : 0}
          />
        );
      })}
    </>
  );
};

