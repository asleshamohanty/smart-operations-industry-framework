import { create } from 'zustand';
import { Sensor3D } from '@/types/sensor3d';

interface SensorState {
  sensorArray: Sensor3D[];
  setSensors: (sensors: Sensor3D[]) => void;
  updateSensor: (sensor: Sensor3D) => void;
  updateSensors: (sensors: Sensor3D[]) => void;
}

export const useSensorStore = create<SensorState>((set) => ({
  sensorArray: [],
  
  setSensors: (sensors: Sensor3D[]) => {
    set({ sensorArray: sensors });
  },
  
  updateSensor: (sensor: Sensor3D) => {
    set(state => {
      const index = state.sensorArray.findIndex(s => s.id === sensor.id);
      if (index >= 0) {
        const newArray = [...state.sensorArray];
        newArray[index] = sensor;
        return { sensorArray: newArray };
      } else {
        return { sensorArray: [...state.sensorArray, sensor] };
      }
    });
  },
  
  updateSensors: (sensors: Sensor3D[]) => {
    set(state => {
      const newArray = [...state.sensorArray];
      sensors.forEach(sensor => {
        const index = newArray.findIndex(s => s.id === sensor.id);
        if (index >= 0) {
          newArray[index] = sensor;
        } else {
          newArray.push(sensor);
        }
      });
      return { sensorArray: newArray };
    });
  },
}));

