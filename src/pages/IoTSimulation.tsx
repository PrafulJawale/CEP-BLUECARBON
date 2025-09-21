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
import { useTranslation } from '@/contexts/LanguageContext';

const IoTSimulation = () => {
  const { user } = useAuth();
  const { sensors, sensorData, getLatestDataBySensor, simulateRealTimeData } = useIoT();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      {/* Header - Made mobile-first with vertical stacking on small screens */}
      <header className="glass px-4 sm:px-6 py-4"> {/* Reduced padding on mobile */}
        <div className="container mt-20 mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"> {/* Stack vertically on mobile, horizontal on sm+ */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold gradient-text">{t('navbar.iotSensors')}</h1> {/* Smaller text on mobile */}
              <p className="text-sm sm:text-base text-muted-foreground">{t('iot.realTimeMonitoring')}</p> {/* Smaller text on mobile */}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"> {/* Stack vertically on mobile */}
            <Badge variant={isSimulating ? "default" : "secondary"} className="bg-sea-green self-start sm:self-auto"> {/* Align to start on mobile */}
              <Activity className={`h-4 w-4 mr-2 ${isSimulating ? 'heartbeat' : ''}`} />
              {isSimulating ? t('iot.live') : t('iot.paused')}
            </Badge>
            <Button
              variant={isSimulating ? "destructive" : "ocean"}
              onClick={() => setIsSimulating(!isSimulating)}
              className="w-full sm:w-auto text-sm sm:text-base" // Full width on mobile, auto on larger; smaller text on mobile
            >
              {isSimulating ? t('iot.stop') : t('iot.start')} {t('iot.simulation')}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8"> {/* Reduced padding on mobile */}
        {/* Sensor Grid - Already mobile-first with single column on small screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"> {/* Smaller gaps on mobile */}
          {sensors.map((sensor) => {
            const latestData = getLatestDataBySensor(sensor.id);
            return (
              <Card 
                key={sensor.id} 
                className={`iot-card glass-card p-4 sm:p-6 cursor-pointer transition-all duration-300 ${ /* Reduced padding on mobile */
                  selectedSensor === sensor.id 
                    ? 'ring-2 ring-ocean-medium bg-ocean-surface/20' 
                    : 'hover:scale-105'
                }`}
                onClick={() => setSelectedSensor(
                  selectedSensor === sensor.id ? null : sensor.id
                )}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4"> {/* Smaller margin on mobile */}
                  <div className="flex items-center space-x-2 sm:space-x-3"> {/* Smaller space on mobile */}
                    <div className={`w-3 h-3 rounded-full ${
                      sensor.status === 'online' ? 'bg-sea-green heartbeat' :
                      sensor.status === 'offline' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} />
                    <h3 className="font-semibold text-base sm:text-lg">{sensor.name}</h3> {/* Smaller text on mobile */}
                  </div>
                  {sensor.status === 'online' ? 
                    <Wifi className="h-4 sm:h-5 w-4 sm:w-5 text-sea-green" /> : 
                    <WifiOff className="h-4 sm:h-5 w-4 sm:w-5 text-red-500" />
                  }
                </div>

                <div className="space-y-2 sm:space-y-3"> {/* Smaller space on mobile */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">{t('iot.location')}</span> {/* Smaller text on mobile */}
                    <span className="text-xs sm:text-sm font-medium">
                      {sensor.location.lat.toFixed(4)}, {sensor.location.lng.toFixed(4)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 sm:space-x-2"> {/* Smaller space on mobile */}
                      <Battery className="h-3 sm:h-4 w-3 sm:w-4" /> {/* Smaller icon on mobile */}
                      <span className="text-xs sm:text-sm">{t('iot.battery')}</span>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Progress value={sensor.batteryLevel} className="w-12 sm:w-16" /> {/* Smaller width on mobile */}
                      <span className="text-xs sm:text-sm font-medium">{sensor.batteryLevel}%</span>
                    </div>
                  </div>

                  {latestData && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-ocean-surface"> {/* Smaller margins on mobile */}
                      <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs"> {/* Smaller gaps and text on mobile */}
                        <div className="data-update">
                          <span className="text-muted-foreground">{t('iot.temperature')}:</span>
                          <span className={`ml-1 font-medium ${getParameterColor('temperature', latestData.parameters.temperature)}`}>
                            {formatParameterValue('temperature', latestData.parameters.temperature)}
                          </span>
                        </div>
                        <div className="data-update">
                          <span className="text-muted-foreground">{t('iot.ph')}:</span>
                          <span className={`ml-1 font-medium ${getParameterColor('pH', latestData.parameters.pH)}`}>
                            {formatParameterValue('pH', latestData.parameters.pH)}
                          </span>
                        </div>
                        <div className="data-update">
                          <span className="text-muted-foreground">{t('iot.moisture')}:</span>
                          <span className={`ml-1 font-medium ${getParameterColor('soilMoisture', latestData.parameters.soilMoisture)}`}>
                            {formatParameterValue('soilMoisture', latestData.parameters.soilMoisture)}
                          </span>
                        </div>
                        <div className="data-update">
                          <span className="text-muted-foreground">{t('iot.salinity')}:</span>
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

        {/* Detailed Sensor View - Already mobile-first */}
        {selectedSensor && (
          <Card className="iot-card glass-card p-4 sm:p-6"> {/* Reduced padding on mobile */}
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 gradient-text"> {/* Smaller text on mobile */}
              {t('iot.detailedSensorData')}: {sensors.find(s => s.id === selectedSensor)?.name}
            </h3>
            
            {(() => {
              const latestData = getLatestDataBySensor(selectedSensor);
              if (!latestData) return <p className="text-muted-foreground">{t('iot.noDataAvailable')}</p>;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"> {/* Single column on mobile */}
                  {Object.entries(latestData.parameters).map(([param, value]) => (
                    <Card key={param} className="glass-card p-3 sm:p-4 data-update"> {/* Reduced padding on mobile */}
                      <div className="flex items-center justify-between mb-1 sm:mb-2"> {/* Smaller margin on mobile */}
                        <div className="flex items-center space-x-1 sm:space-x-2"> {/* Smaller space on mobile */}
                          {getParameterIcon(param)}
                          <h4 className="font-medium text-xs sm:text-sm">{getParameterName(param)}</h4> {/* Smaller text on mobile */}
                        </div>
                      </div>
                      
                      <div className={`text-xl sm:text-2xl font-bold ${getParameterColor(param, value)}`}> {/* Smaller text on mobile */}
                        {formatParameterValue(param, value)}
                      </div>
                      
                      <div className="mt-1 sm:mt-2"> {/* Smaller margin on mobile */}
                        <div className="text-xs text-muted-foreground mb-1">{t('iot.status')}</div>
                        <Badge 
                          variant={getParameterColor(param, value).includes('red') ? 'destructive' : 'default'}
                          className={getParameterColor(param, value).includes('red') ? '' : 'bg-sea-green text-white'}
                        >
                          {getParameterColor(param, value).includes('red') ? t('iot.alert') : t('iot.normal')}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              );
            })()}
          </Card>
        )}

        {/* Quick Actions - Already mobile-first with single column on small screens */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8"> {/* Smaller gaps on mobile */}
          <Card className="iot-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-4 sm:p-6" /* Reduced padding on mobile */
                onClick={() => navigate('/analytics')}>
            <div className="text-center">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"> {/* Smaller size on mobile */}
                <Activity className="h-6 sm:h-8 w-6 sm:w-8 text-white" /> {/* Smaller icon on mobile */}
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{t('iot.historicalData')}</h3> {/* Smaller text on mobile */}
              <p className="text-muted-foreground text-xs sm:text-sm"> {/* Smaller text on mobile */}
                {t('iot.viewTrends')}
              </p>
            </div>
          </Card>

          <Card className="iot-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-4 sm:p-6" /* Reduced padding on mobile */
                onClick={() => navigate('/gis-mapping')}>
            <div className="text-center">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-sea rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"> {/* Smaller size on mobile */}
                <Zap className="h-6 sm:h-8 w-6 sm:w-8 text-white" /> {/* Smaller icon on mobile */}
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{t('iot.mapView')}</h3> {/* Smaller text on mobile */}
              <p className="text-muted-foreground text-xs sm:text-sm"> {/* Smaller text on mobile */}
                {t('iot.seeSensorLocations')}
              </p>
            </div>
          </Card>

          <Card className="iot-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-4 sm:p-6" /* Reduced padding on mobile */
                onClick={() => navigate('/fraud-detection')}>
            <div className="text-center">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-coral rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"> {/* Smaller size on mobile */}
                <Eye className="h-6 sm:h-8 w-6 sm:w-8 text-white" /> {/* Smaller icon on mobile */}
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{t('iot.anomalyDetection')}</h3> {/* Smaller text on mobile */}
              <p className="text-muted-foreground text-xs sm:text-sm"> {/* Smaller text on mobile */}
                {t('iot.aiPoweredDetection')}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IoTSimulation;