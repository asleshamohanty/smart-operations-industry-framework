import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import { Mesh } from 'three';
import { Sensor3D } from '@/types/sensor3d';
import { useNavigate } from 'react-router-dom';

interface SensorNodeProps {
  sensor: Sensor3D;
}

export const SensorNode: React.FC<SensorNodeProps> = ({ sensor }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  
  const isAnomaly = sensor.status === 'anomaly';
  
  // Color based on status
  const baseColor = isAnomaly ? '#ef4444' : '#22c55e';
  const emissiveColor = isAnomaly ? '#dc2626' : '#16a34a';
  
  // Size based on severity
  const getSizeMultiplier = () => {
    if (!sensor.severity) return 1;
    switch (sensor.severity) {
      case 'critical': return 1.5;
      case 'high': return 1.3;
      case 'medium': return 1.1;
      case 'low': return 1.0;
      default: return 1.0;
    }
  };
  
  const size = 0.3 * getSizeMultiplier();
  
  // Animation
  useFrame((state) => {
    if (meshRef.current) {
      // Bobbing animation
      meshRef.current.position.y = 
        sensor.location.y + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      
      // Pulsating for anomalies
      if (isAnomaly) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
        meshRef.current.scale.setScalar(scale);
      }
      
      // Hover effect
      if (hovered) {
        meshRef.current.rotation.y += 0.02;
      }
    }
  });
  
  const handleClick = () => {
    if (isAnomaly) {
      const anomalyData = {
        id: sensor.id,
        sensorName: sensor.name,
        sensorType: sensor.type,
        location: `${sensor.location.x.toFixed(1)}, ${sensor.location.y.toFixed(1)}, ${sensor.location.z.toFixed(1)}`,
        timestamp: sensor.updatedAt,
        value: sensor.value,
        unit: sensor.unit,
        normalRange: sensor.normalRange,
        severity: sensor.severity || 'medium',
        confidence: 0.85,
        description: `Anomaly detected in ${sensor.name}`,
        resolved: false
      };
      const encodedData = encodeURIComponent(JSON.stringify(anomalyData));
      navigate(`/anomaly/${sensor.id}?data=${encodedData}&source=3d`);
    }
  };
  
  return (
    <group position={[sensor.location.x, sensor.location.y, sensor.location.z]}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={isAnomaly ? 0.5 : 0.2}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      
      {/* Glow effect for anomalies */}
      {isAnomaly && (
        <mesh scale={1.3}>
          <sphereGeometry args={[size, 16, 16]} />
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.2}
          />
        </mesh>
      )}
      
      {/* Label */}
      <Text
        position={[0, size + 0.3, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {sensor.name.replace('_Sensor', '')}
      </Text>
      
      {/* Tooltip on hover */}
      {hovered && (
        <Html distanceFactor={10}>
          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs whitespace-nowrap">
            <div className="font-semibold">{sensor.name}</div>
            <div className="text-gray-300">{sensor.type}</div>
            <div className="mt-1">
              <span className={isAnomaly ? 'text-red-400' : 'text-green-400'}>
                {sensor.value.toFixed(1)} {sensor.unit}
              </span>
            </div>
            <div className="text-gray-400 text-xs">
              Range: {sensor.normalRange[0]}-{sensor.normalRange[1]} {sensor.unit}
            </div>
            {isAnomaly && (
              <div className="mt-1 text-red-400 font-semibold">
                ANOMALY - Click for details
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

