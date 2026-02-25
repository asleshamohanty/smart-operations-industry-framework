import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Grid } from '@react-three/drei';
import { SensorNode } from './SensorNode';
import { Links } from './Links';
import { Building } from './Building';
import { useSensorStore } from '@/state/sensors';

export const SceneCanvas: React.FC = () => {
  const sensors = useSensorStore(state => state.sensorArray);
  
  return (
    <div className="w-full h-full bg-gray-900">
      <Canvas
        camera={{ position: [25, 12, 25], fov: 50 }}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.6} castShadow />
          <pointLight position={[-10, -10, -5]} intensity={0.3} />
          <hemisphereLight args={['#b1e1ff', '#000000', 0.5]} />
          
          {/* Background */}
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
          
          {/* Grid */}
          <Grid
            args={[50, 50]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#9ca3af"
            fadeDistance={30}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
          />
          
          {/* Building Model */}
          <Building />
          
          {/* Sensors */}
          {sensors.map(sensor => (
            <SensorNode key={sensor.id} sensor={sensor} />
          ))}
          
          {/* Links between sensors */}
          <Links sensors={sensors} />
          
          {/* Camera Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

