import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIoT } from '@/contexts/IoTContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  Zap, 
  Wifi, 
  WifiOff, 
  Battery, 
  Home,
  Gauge,
  Waves,
  Eye,
  Beaker
} from 'lucide-react';
import { gsap } from 'gsap';

const IoTSimulation = () => {
  const { user } = useAuth();
  const { sensors, sensorData, getLatestDataBySensor, simulateRealTimeData } = useIoT();
  const navigate = useNavigate();
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Animate components on load
    gsap.fromTo('.iot-card', 
      { opacity: 0, y: 30, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out', stagger: 0.1 }
    );

    // Heartbeat animation for real-time indicators
    gsap.to('.heartbeat', {
      scale: 1.1,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut'
    });
  }, [user, navigate]);

  useEffect(() => {
    // Auto-simulate data every 5 seconds
    const interval = setInterval(() => {
      if (isSimulating) {
        simulateRealTimeData();
        
        // Trigger heartbeat animation on update
        gsap.fromTo('.data-update',
          { scale: 1, backgroundColor: 'transparent' },
          { scale: 1.05, backgroundColor: 'rgba(34, 197, 94, 0.1)', duration: 0.3, yoyo: true, repeat: 1 }
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isSimulating, simulateRealTimeData]);

  if (!user) return null;

  const getParameterIcon = (param: string) => {
    switch (param) {
      case 'temperature': return <Thermometer className="h-4 w-4" />;
      case 'soilMoisture': return <Droplets className="h-4 w-4" />;
      case 'pH': return <Beaker className="h-4 w-4" />;
      case 'salinity': return <Waves className="h-4 w-4" />;
      case 'waterDepth': return <Gauge className="h-4 w-4" />;
      case 'oxygenLevel': return <Activity className="h-4 w-4" />;
      case 'turbidity': return <Eye className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getParameterColor = (param: string, value: number) => {
    switch (param) {
      case 'temperature':
        return value < 20 ? 'text-blue-500' : value > 35 ? 'text-red-500' : 'text-sea-green';
      case 'pH':
        return value < 6.5 || value > 8.5 ? 'text-red-500' : 'text-sea-green';
      case 'salinity':
        return value < 10 || value > 30 ? 'text-yellow-500' : 'text-sea-green';
      case 'soilMoisture':
        return value < 20 ? 'text-red-500' : value > 80 ? 'text-blue-500' : 'text-sea-green';
      default:
        return 'text-sea-green';
    }
  };

  const formatParameterValue = (param: string, value: number) => {
    switch (param) {
      case 'temperature': return `${value}°C`;
      case 'soilMoisture': return `${value}%`;
      case 'pH': return value.toFixed(1);
      case 'salinity': return `${value} ppt`;
      case 'waterDepth': return `${value} cm`;
      case 'oxygenLevel': return `${value} mg/L`;
      case 'turbidity': return `${value} NTU`;
      default: return value.toString();
    }
  };

  const getParameterName = (param: string) => {
    switch (param) {
      case 'soilMoisture': return 'Soil Moisture';
      case 'waterDepth': return 'Water Depth';
      case 'oxygenLevel': return 'Oxygen Level';
      default: return param.charAt(0).toUpperCase() + param.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="glass px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text">IoT Live Simulation</h1>
              <p className="text-muted-foreground">Real-time Environmental Monitoring</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={isSimulating ? "default" : "secondary"} className="bg-sea-green">
              <Activity className={`h-4 w-4 mr-2 ${isSimulating ? 'heartbeat' : ''}`} />
              {isSimulating ? 'Live' : 'Paused'}
            </Badge>
            <Button
              variant={isSimulating ? "destructive" : "ocean"}
              onClick={() => setIsSimulating(!isSimulating)}
            >
              {isSimulating ? 'Stop' : 'Start'} Simulation
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Sensor Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sensors.map((sensor) => {
            const latestData = getLatestDataBySensor(sensor.id);
            return (
              <Card 
                key={sensor.id} 
                className={`iot-card glass-card p-6 cursor-pointer transition-all duration-300 ${
                  selectedSensor === sensor.id 
                    ? 'ring-2 ring-ocean-medium bg-ocean-surface/20' 
                    : 'hover:scale-105'
                }`}
                onClick={() => setSelectedSensor(
                  selectedSensor === sensor.id ? null : sensor.id
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      sensor.status === 'online' ? 'bg-sea-green heartbeat' :
                      sensor.status === 'offline' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} />
                    <h3 className="font-semibold text-lg">{sensor.name}</h3>
                  </div>
                  {sensor.status === 'online' ? 
                    <Wifi className="h-5 w-5 text-sea-green" /> :
                    <WifiOff className="h-5 w-5 text-red-500" />
                  }
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="text-sm font-medium">
                      {sensor.location.lat.toFixed(4)}, {sensor.location.lng.toFixed(4)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Battery className="h-4 w-4" />
                      <span className="text-sm">Battery</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={sensor.batteryLevel} className="w-16" />
                      <span className="text-sm font-medium">{sensor.batteryLevel}%</span>
                    </div>
                  </div>

                  {latestData && (
                    <div className="mt-4 pt-4 border-t border-ocean-surface">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="data-update">
                          <span className="text-muted-foreground">Temp:</span>
                          <span className={`ml-1 font-medium ${getParameterColor('temperature', latestData.parameters.temperature)}`}>
                            {formatParameterValue('temperature', latestData.parameters.temperature)}
                          </span>
                        </div>
                        <div className="data-update">
                          <span className="text-muted-foreground">pH:</span>
                          <span className={`ml-1 font-medium ${getParameterColor('pH', latestData.parameters.pH)}`}>
                            {formatParameterValue('pH', latestData.parameters.pH)}
                          </span>
                        </div>
                        <div className="data-update">
                          <span className="text-muted-foreground">Moisture:</span>
                          <span className={`ml-1 font-medium ${getParameterColor('soilMoisture', latestData.parameters.soilMoisture)}`}>
                            {formatParameterValue('soilMoisture', latestData.parameters.soilMoisture)}
                          </span>
                        </div>
                        <div className="data-update">
                          <span className="text-muted-foreground">Salinity:</span>
                          <span className={`ml-1 font-medium ${getParameterColor('salinity', latestData.parameters.salinity)}`}>
                            {formatParameterValue('salinity', latestData.parameters.salinity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Last reading: {new Date(sensor.lastReading).toLocaleTimeString()}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Detailed Sensor View */}
        {selectedSensor && (
          <Card className="iot-card glass-card p-6">
            <h3 className="text-xl font-semibold mb-6 gradient-text">
              Detailed Sensor Data: {sensors.find(s => s.id === selectedSensor)?.name}
            </h3>
            
            {(() => {
              const latestData = getLatestDataBySensor(selectedSensor);
              if (!latestData) return <p className="text-muted-foreground">No data available</p>;

              return (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(latestData.parameters).map(([param, value]) => (
                    <Card key={param} className="glass-card p-4 data-update">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getParameterIcon(param)}
                          <h4 className="font-medium text-sm">{getParameterName(param)}</h4>
                        </div>
                      </div>
                      
                      <div className={`text-2xl font-bold ${getParameterColor(param, value)}`}>
                        {formatParameterValue(param, value)}
                      </div>
                      
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">Status</div>
                        <Badge 
                          variant={getParameterColor(param, value).includes('red') ? 'destructive' : 'default'}
                          className={getParameterColor(param, value).includes('red') ? '' : 'bg-sea-green text-white'}
                        >
                          {getParameterColor(param, value).includes('red') ? 'Alert' : 'Normal'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              );
            })()}
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card className="iot-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-6"
                onClick={() => navigate('/analytics')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Historical Data</h3>
              <p className="text-muted-foreground text-sm">
                View trends and historical sensor readings
              </p>
            </div>
          </Card>

          <Card className="iot-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-6"
                onClick={() => navigate('/gis-mapping')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-sea rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Map View</h3>
              <p className="text-muted-foreground text-sm">
                See sensor locations on interactive map
              </p>
            </div>
          </Card>

          <Card className="iot-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-6"
                onClick={() => navigate('/fraud-detection')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Anomaly Detection</h3>
              <p className="text-muted-foreground text-sm">
                AI-powered fraud and anomaly detection
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IoTSimulation;