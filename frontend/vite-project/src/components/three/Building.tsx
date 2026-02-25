import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

export const Building: React.FC = () => {
  return (
    <group>
      {/* Main Building Structure */}
      <group position={[0, 0, 0]}>
        {/* Ground Floor */}
        <Box args={[12, 0.5, 12]} position={[0, 0.25, 0]}>
          <meshStandardMaterial color="#4a5568" metalness={0.3} roughness={0.7} />
        </Box>
        
        {/* Floor 1 */}
        <Box args={[11, 2, 11]} position={[0, 1.5, 0]}>
          <meshStandardMaterial color="#2d3748" metalness={0.4} roughness={0.6} />
        </Box>
        
        {/* Floor 2 */}
        <Box args={[10, 2, 10]} position={[0, 3.5, 0]}>
          <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.6} />
        </Box>
        
        {/* Floor 3 */}
        <Box args={[9, 2, 9]} position={[0, 5.5, 0]}>
          <meshStandardMaterial color="#4b5563" metalness={0.4} roughness={0.6} />
        </Box>
        
        {/* Roof */}
        <Box args={[9.5, 0.3, 9.5]} position={[0, 7, 0]}>
          <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.5} />
        </Box>
        
        {/* Windows - Floor 1 */}
        {[-4, -1, 2].map((x, i) => (
          <React.Fragment key={`window-f1-${i}`}>
            <Box args={[1.5, 1.2, 0.1]} position={[x, 1.5, 5.55]}>
              <meshStandardMaterial color="#60a5fa" metalness={0.8} roughness={0.1} emissive="#60a5fa" emissiveIntensity={0.2} />
            </Box>
            <Box args={[1.5, 1.2, 0.1]} position={[x, 1.5, -5.55]}>
              <meshStandardMaterial color="#60a5fa" metalness={0.8} roughness={0.1} emissive="#60a5fa" emissiveIntensity={0.2} />
            </Box>
          </React.Fragment>
        ))}
        
        {/* Windows - Floor 2 */}
        {[-3.5, -0.5, 2.5].map((x, i) => (
          <React.Fragment key={`window-f2-${i}`}>
            <Box args={[1.5, 1.2, 0.1]} position={[x, 3.5, 5.05]}>
              <meshStandardMaterial color="#60a5fa" metalness={0.8} roughness={0.1} emissive="#60a5fa" emissiveIntensity={0.2} />
            </Box>
            <Box args={[1.5, 1.2, 0.1]} position={[x, 3.5, -5.05]}>
              <meshStandardMaterial color="#60a5fa" metalness={0.8} roughness={0.1} emissive="#60a5fa" emissiveIntensity={0.2} />
            </Box>
          </React.Fragment>
        ))}
        
        {/* Windows - Floor 3 */}
        {[-3, 0, 3].map((x, i) => (
          <React.Fragment key={`window-f3-${i}`}>
            <Box args={[1.5, 1.2, 0.1]} position={[x, 5.5, 4.55]}>
              <meshStandardMaterial color="#60a5fa" metalness={0.8} roughness={0.1} emissive="#60a5fa" emissiveIntensity={0.2} />
            </Box>
            <Box args={[1.5, 1.2, 0.1]} position={[x, 5.5, -4.55]}>
              <meshStandardMaterial color="#60a5fa" metalness={0.8} roughness={0.1} emissive="#60a5fa" emissiveIntensity={0.2} />
            </Box>
          </React.Fragment>
        ))}
        
        {/* Door */}
        <Box args={[2, 2.2, 0.1]} position={[0, 1.1, 5.55]}>
          <meshStandardMaterial color="#1e3a8a" metalness={0.5} roughness={0.4} />
        </Box>
        
        {/* Chimney/Vent */}
        <Cylinder args={[0.5, 0.5, 1.5, 8]} position={[3, 7.75, 3]}>
          <meshStandardMaterial color="#6b7280" metalness={0.6} roughness={0.4} />
        </Cylinder>
        
        {/* Antenna */}
        <Cylinder args={[0.1, 0.1, 2, 8]} position={[-3, 8.5, -3]}>
          <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
        </Cylinder>
        <mesh position={[-3, 9.5, -3]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
        </mesh>
      </group>
      
      {/* Surrounding Structures */}
      {/* Ground platform */}
      <Box args={[30, 0.2, 30]} position={[0, -0.1, 0]}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.2} roughness={0.8} />
      </Box>
      
      {/* Generator shed */}
      <Box args={[3, 2, 3]} position={[-10, 1, -10]}>
        <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.7} />
      </Box>
      
      {/* Water tank */}
      <Cylinder args={[1.5, 1.5, 3, 16]} position={[10, 1.5, -10]}>
        <meshStandardMaterial color="#0ea5e9" metalness={0.6} roughness={0.3} transparent opacity={0.7} />
      </Cylinder>
      
      {/* Solar panels */}
      <Box args={[4, 0.1, 3]} position={[-10, 2.5, 10]} rotation={[0.3, 0, 0]}>
        <meshStandardMaterial color="#1e40af" metalness={0.8} roughness={0.2} />
      </Box>
    </group>
  );
};

