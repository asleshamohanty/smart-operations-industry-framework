import { Sensor3D } from '@/types/sensor3d';

/**
 * Generate 3D coordinates for sensors using a circular layout
 */
export const generateCircularLayout = (
  sensors: Sensor3D[],
  radius: number = 10,
  height: number = 0
): Sensor3D[] => {
  const angleStep = (2 * Math.PI) / sensors.length;
  
  return sensors.map((sensor, index) => {
    const angle = index * angleStep;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = height + (Math.random() - 0.5) * 2; // Add some vertical variation
    
    return {
      ...sensor,
      location: { x, y, z }
    };
  });
};

/**
 * Generate 3D coordinates for sensors using a grid layout
 */
export const generateGridLayout = (
  sensors: Sensor3D[],
  gridSize: number = 5,
  spacing: number = 3
): Sensor3D[] => {
  return sensors.map((sensor, index) => {
    const x = (index % gridSize) * spacing - (gridSize * spacing) / 2;
    const z = Math.floor(index / gridSize) * spacing - (gridSize * spacing) / 2;
    const y = (Math.random() - 0.5) * 2; // Random height variation
    
    return {
      ...sensor,
      location: { x, y, z }
    };
  });
};

/**
 * Map sensor type to a specific zone in 3D space (on/around building)
 */
export const getSensorZone = (sensorType: string): { x: number; y: number; z: number } => {
  const zones: Record<string, { x: number; y: number; z: number }> = {
    // Weather sensors - Rooftop
    'Temperature': { x: -3, y: 7.5, z: -3 },
    'Precipitation': { x: 3, y: 7.5, z: -3 },
    'Rainfall': { x: 3, y: 7.5, z: -3 },
    'Wind Speed': { x: -3, y: 7.5, z: 3 },
    'Wind': { x: -3, y: 7.5, z: 3 },
    'Weather Impact': { x: 0, y: 7.5, z: 0 },
    
    // ESG sensors - Floor 2
    'Environmental Impact': { x: -4, y: 3.5, z: 0 },
    'Social Impact': { x: 4, y: 3.5, z: 0 },
    'Governance Impact': { x: 0, y: 3.5, z: -4 },
    
    // Resource monitoring - Floor 1
    'Carbon Emissions': { x: -10, y: 1.5, z: -10 },
    'Carbon Footprint': { x: -10, y: 1.5, z: -10 },
    'Water Usage': { x: 10, y: 1.5, z: -10 },
    'Energy Usage': { x: -10, y: 1.5, z: 10 },
    
    // Compliance - Floor 3
    'SDG Compliance': { x: 0, y: 5.5, z: 4 },
    
    // Performance metrics - Outside building
    'Schedule Delay': { x: 0, y: 4, z: 7 },
    'Cost Overrun': { x: 7, y: 4, z: 0 },
    'ESG Performance': { x: 0, y: 4, z: -7 },
    'Profitability Impact': { x: -7, y: 4, z: 0 },
  };
  
  return zones[sensorType] || { x: 0, y: 2, z: 0 };
};

