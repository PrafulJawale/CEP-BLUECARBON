import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';

export interface SensorData {
  id: string;
  projectId: string;
  sensorId: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
  };
  parameters: {
    soilMoisture: number; // 0-100%
    pH: number; // 0-14
    salinity: number; // ppt
    waterDepth: number; // cm
    temperature: number; // celsius
    oxygenLevel: number; // mg/L
    turbidity: number; // NTU
  };
}

export interface IoTSensor {
  id: string;
  name: string;
  projectId: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'online' | 'offline' | 'maintenance';
  batteryLevel: number; // 0-100%
  lastReading: string;
}

interface IoTContextType {
  sensors: IoTSensor[];
  sensorData: SensorData[];
  addSensor: (sensor: Omit<IoTSensor, 'id'>) => void;
  updateSensorData: (data: Omit<SensorData, 'id' | 'timestamp'>) => void;
  getSensorsByProject: (projectId: string) => IoTSensor[];
  getLatestDataBySensor: (sensorId: string) => SensorData | null;
  simulateRealTimeData: () => void;
}

const IoTContext = createContext<IoTContextType | undefined>(undefined);

export const useIoT = () => {
  const context = useContext(IoTContext);
  if (context === undefined) {
    throw new Error('useIoT must be used within an IoTProvider');
  }
  return context;
};

// Simulate real-time sensor data
const generateRandomSensorData = (sensor: IoTSensor): Omit<SensorData, 'id' | 'timestamp'> => ({
  projectId: sensor.projectId,
  sensorId: sensor.id,
  location: sensor.location,
  parameters: {
    soilMoisture: Math.round((Math.random() * 40 + 30) * 100) / 100, // 30-70%
    pH: Math.round((Math.random() * 2 + 6.5) * 100) / 100, // 6.5-8.5
    salinity: Math.round((Math.random() * 10 + 15) * 100) / 100, // 15-25 ppt
    waterDepth: Math.round((Math.random() * 50 + 20) * 100) / 100, // 20-70 cm
    temperature: Math.round((Math.random() * 10 + 25) * 100) / 100, // 25-35°C
    oxygenLevel: Math.round((Math.random() * 3 + 6) * 100) / 100, // 6-9 mg/L
    turbidity: Math.round((Math.random() * 20 + 5) * 100) / 100, // 5-25 NTU
  },
});

export const IoTProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);

  const updateSensorData = useCallback((data: Omit<SensorData, 'id' | 'timestamp'>) => {
    const newData: SensorData = {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    const updatedData = [newData, ...sensorData].slice(0, 1000); // Keep only last 1000 readings
    setSensorData(updatedData);
    localStorage.setItem('bluecarbon_sensor_data', JSON.stringify(updatedData));
  }, [sensorData]);

  useEffect(() => {
    // Initialize sensors
    const storedSensors = localStorage.getItem('bluecarbon_sensors');
    if (!storedSensors) {
      const sampleSensors: IoTSensor[] = [
        {
          id: 'sensor_1',
          name: 'Mangrove Sensor A1',
          projectId: '1',
          location: { lat: 21.9497, lng: 88.2516 },
          status: 'online',
          batteryLevel: 87,
          lastReading: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: 'sensor_2',
          name: 'Mangrove Sensor A2',
          projectId: '1',
          location: { lat: 21.9520, lng: 88.2540 },
          status: 'online',
          batteryLevel: 92,
          lastReading: new Date(Date.now() - 180000).toISOString(),
        },
        {
          id: 'sensor_3',
          name: 'Coastal Sensor B1',
          projectId: '2',
          location: { lat: 10.8505, lng: 76.2711 },
          status: 'maintenance',
          batteryLevel: 45,
          lastReading: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      localStorage.setItem('bluecarbon_sensors', JSON.stringify(sampleSensors));
      setSensors(sampleSensors);
    } else {
      setSensors(JSON.parse(storedSensors));
    }

    // Initialize sensor data
    const storedData = localStorage.getItem('bluecarbon_sensor_data');
    if (storedData) {
      setSensorData(JSON.parse(storedData));
    }
  }, []);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (sensors.length > 0) {
        const onlineSensors = sensors.filter(s => s.status === 'online');
        if (onlineSensors.length > 0) {
          const randomSensor = onlineSensors[Math.floor(Math.random() * onlineSensors.length)];
          updateSensorData(generateRandomSensorData(randomSensor));
        }
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [sensors, updateSensorData]);

  const addSensor = (sensorData: Omit<IoTSensor, 'id'>) => {
    const newSensor: IoTSensor = {
      ...sensorData,
      id: `sensor_${Date.now()}`,
    };

    const updatedSensors = [...sensors, newSensor];
    setSensors(updatedSensors);
    localStorage.setItem('bluecarbon_sensors', JSON.stringify(updatedSensors));
  };

  const getSensorsByProject = (projectId: string) => {
    return sensors.filter(sensor => sensor.projectId === projectId);
  };

  const getLatestDataBySensor = (sensorId: string) => {
    const readings = sensorData.filter(data => data.sensorId === sensorId);
    return readings.length > 0 ? readings[0] : null;
  };

  const simulateRealTimeData = () => {
    sensors.forEach(sensor => {
      if (sensor.status === 'online') {
        setTimeout(() => {
          updateSensorData(generateRandomSensorData(sensor));
        }, Math.random() * 5000);
      }
    });
  };

  return (
    <IoTContext.Provider
      value={{
        sensors,
        sensorData,
        addSensor,
        updateSensorData,
        getSensorsByProject,
        getLatestDataBySensor,
        simulateRealTimeData,
      }}
    >
      {children}
    </IoTContext.Provider>
  );
};