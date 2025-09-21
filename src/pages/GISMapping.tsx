import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Layers, Satellite, Activity, Home, Zap, ZoomIn, ZoomOut } from 'lucide-react';
import { gsap } from 'gsap';
import { useTranslation } from '@/contexts/LanguageContext';

// Simple 3D Map Component (without mapbox for demo)
const InteractiveMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedLayer, setSelectedLayer] = useState<'satellite' | 'drone' | 'heatmap'>('satellite');
  const [zoom, setZoom] = useState(5);

  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size dynamically for responsiveness
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetWidth * 0.625; // Maintain aspect ratio (e.g., 16:10)
    } else {
      canvas.width = 800;
      canvas.height = 500;
    }

    const scale = canvas.width / 800; // Scale factor for responsiveness

    // Clear canvas
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw coastline
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(100 * scale, 100 * scale);
    ctx.quadraticCurveTo(200 * scale, 80 * scale, 300 * scale, 120 * scale);
    ctx.quadraticCurveTo(400 * scale, 150 * scale, 500 * scale, 130 * scale);
    ctx.quadraticCurveTo(600 * scale, 110 * scale, 700 * scale, 140 * scale);
    ctx.stroke();

    // Draw restoration sites
    const sites = [
      { x: 150, y: 110, size: 20, name: 'Sundarbans' },
      { x: 350, y: 135, size: 15, name: 'Kerala Coast' },
      { x: 550, y: 125, size: 18, name: 'Tamil Nadu' },
    ];

    sites.forEach((site, index) => {
      // Site polygon
      ctx.fillStyle = selectedLayer === 'heatmap' 
        ? `rgba(34, 197, 94, ${0.3 + index * 0.2})` 
        : 'rgba(34, 197, 94, 0.6)';
      ctx.beginPath();
      ctx.arc(site.x * scale, site.y * scale, site.size * (zoom / 5) * scale, 0, Math.PI * 2);
      ctx.fill();

      // Site marker
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(site.x * scale, site.y * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = `${12 * scale}px Arial`;
      ctx.fillText(site.name, site.x * scale - 20 * scale, site.y * scale - site.size * (zoom / 5) * scale - 10 * scale);
    });

    // Draw sensors if drone layer
    if (selectedLayer === 'drone') {
      const sensors = [
        { x: 140, y: 105 }, { x: 160, y: 115 },
        { x: 340, y: 130 }, { x: 360, y: 140 },
        { x: 540, y: 120 }, { x: 560, y: 130 },
      ];

      sensors.forEach(sensor => {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(sensor.x * scale, sensor.y * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Pulsing effect
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.arc(sensor.x * scale, sensor.y * scale, 8 * scale, 0, Math.PI * 2);
        ctx.stroke();
      });
    }
  };

  useEffect(() => {
    drawMap();
  }, [selectedLayer, zoom]);

  useEffect(() => {
    const handleResize = () => {
      drawMap();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedLayer, zoom]); // Include dependencies to ensure proper redraw

  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        className="w-full rounded-lg border border-ocean-surface bg-ocean-deep"
        style={{ height: 'auto', aspectRatio: '16/10' }} // Responsive height with aspect ratio
      />
      
      {/* Map Controls */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col gap-1 sm:gap-2"> {/* Smaller gaps and positioning on mobile */}
        <Button
          variant="ocean"
          size="sm"
          className="p-1 sm:p-2" // Smaller padding on mobile
          onClick={() => setZoom(Math.min(10, zoom + 1))}
        >
          <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" /> {/* Smaller icon on mobile */}
        </Button>
        <Button
          variant="ocean"
          size="sm"
          className="p-1 sm:p-2" // Smaller padding on mobile
          onClick={() => setZoom(Math.max(1, zoom - 1))}
        >
          <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" /> {/* Smaller icon on mobile */}
        </Button>
      </div>

      {/* Layer Controls */}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 flex flex-wrap gap-1 sm:gap-2"> {/* Wrap on mobile, smaller gaps */}
        <Button
          variant={selectedLayer === 'satellite' ? 'ocean' : 'outline'}
          size="sm"
          className="text-xs sm:text-sm p-1 sm:p-2" // Smaller text and padding on mobile
          onClick={() => setSelectedLayer('satellite')}
        >
          <Satellite className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> {/* Smaller icon on mobile */}
          Satellite
        </Button>
        <Button
          variant={selectedLayer === 'drone' ? 'ocean' : 'outline'}
          size="sm"
          className="text-xs sm:text-sm p-1 sm:p-2" // Smaller text and padding on mobile
          onClick={() => setSelectedLayer('drone')}
        >
          <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> {/* Smaller icon on mobile */}
          Drone
        </Button>
        <Button
          variant={selectedLayer === 'heatmap' ? 'ocean' : 'outline'}
          size="sm"
          className="text-xs sm:text-sm p-1 sm:p-2" // Smaller text and padding on mobile
          onClick={() => setSelectedLayer('heatmap')}
        >
          <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> {/* Smaller icon on mobile */}
          Heatmap
        </Button>
      </div>

      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-black/20 backdrop-blur-sm text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm"> {/* Smaller text and padding on mobile */}
        Zoom: {zoom}x
      </div>
    </div>
  );
};

const GISMapping = () => {
  const { user } = useAuth();
  const { projects } = useData();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Animate cards on load
    gsap.fromTo('.gis-card', 
      { opacity: 0, y: 30, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power2.out', stagger: 0.1 }
    );

    // Animate map zoom
    gsap.fromTo('.map-container', 
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 1, ease: 'power2.out', delay: 0.3 }
    );
  }, [user, navigate]);

  if (!user) return null;

  const verifiedProjects = projects.filter(p => p.verified);

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="glass px-4 sm:px-6 py-4"> {/* Reduced padding on mobile */}
        <div className="container mt-20 mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"> {/* Stack vertically on mobile */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold gradient-text">{t('navbar.gisMapping')}</h1> {/* Smaller text on mobile */}
              <p className="text-sm sm:text-base text-muted-foreground">{t('gis.geospatialView')}</p> {/* Smaller text on mobile */}
            </div>
          </div>
          <Badge variant="outline" className="bg-ocean-surface self-start sm:self-auto"> {/* Align to start on mobile */}
            <MapPin className="h-4 w-4 mr-2" />
            {verifiedProjects.length} {t('common.activeSites')}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8"> {/* Reduced padding on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8"> {/* Single column on mobile, smaller gaps */}
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="gis-card glass-card p-4 sm:p-6"> {/* Reduced padding on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6"> {/* Stack vertically on mobile */}
                <h3 className="text-lg sm:text-xl font-semibold gradient-text mb-2 sm:mb-0">{t('gis.interactiveMap')}</h3> {/* Smaller text on mobile */}
                <div className="flex items-center space-x-2">
                  <Layers className="h-4 sm:h-5 w-4 sm:w-5 text-ocean-medium" /> {/* Smaller icon on mobile */}
                  <span className="text-xs sm:text-sm text-muted-foreground">{t('gis.multipleLayers')}</span> {/* Smaller text on mobile */}
                </div>
              </div>
              
              <div className="map-container">
                <InteractiveMap />
              </div>

              {/* Map Legend */}
              <div className="mt-4 p-3 sm:p-4 bg-ocean-surface/20 rounded-lg"> {/* Reduced padding on mobile */}
                <h4 className="font-medium mb-2 text-sm sm:text-base">{t('gis.legend')}</h4> {/* Smaller text on mobile */}
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm"> {/* Smaller text on mobile */}
                  <div className="flex items-center space-x-2">
                    <div className="w-3 sm:w-4 h-3 sm:h-4 bg-sea-green rounded-full"></div> {/* Smaller size on mobile */}
                    <span>{t('gis.restorationSites')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 sm:w-4 h-3 sm:h-4 bg-destructive rounded-full"></div> {/* Smaller size on mobile */}
                    <span>{t('gis.projectCenters')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 sm:w-4 h-3 sm:h-4 bg-yellow-500 rounded-full"></div> {/* Smaller size on mobile */}
                    <span>{t('gis.iotSensors')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 sm:w-4 h-3 sm:h-4 bg-ocean-medium rounded-full"></div> {/* Smaller size on mobile */}
                    <span>{t('gis.waterBodies')}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Project List */}
          <div className="space-y-4 sm:space-y-6"> {/* Smaller space on mobile */}
            <Card className="gis-card glass-card p-4 sm:p-6"> {/* Reduced padding on mobile */}
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 gradient-text">{t('gis.activeProjects')}</h3> {/* Smaller text on mobile */}
              <div className="space-y-2 sm:space-y-3"> {/* Smaller space on mobile */}
                {verifiedProjects.slice(0, 5).map((project) => (
                  <div 
                    key={project.id}
                    className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-300 ${ /* Reduced padding on mobile */
                      selectedProject === project.id 
                        ? 'bg-ocean-medium text-white' 
                        : 'bg-ocean-surface/30 hover:bg-ocean-surface/50'
                    }`}
                    onClick={() => setSelectedProject(
                      selectedProject === project.id ? null : project.id
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between"> {/* Stack vertically on mobile */}
                      <div className="flex-1 mb-2 sm:mb-0">
                        <h4 className="font-medium text-xs sm:text-sm">{project.name}</h4> {/* Smaller text on mobile */}
                        <p className="text-xs opacity-75 mt-1">
                          {project.gpsCoordinates.lat.toFixed(4)}, {project.gpsCoordinates.lng.toFixed(4)}
                        </p>
                        <div className="flex items-center space-x-2 sm:space-x-4 mt-1 sm:mt-2 text-xs"> {/* Smaller space on mobile */} 
                          <span>{project.treeCount} trees</span>
                          <span>{project.co2Sequestered.toFixed(1)}t CO₂</span>
                        </div>
                      </div>
                      {/* Align to start on mobile */}
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-sea-green text-white self-start sm:self-auto"
                      >
                        Verified
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="ocean" 
                className="w-full mt-3 sm:mt-4 text-sm sm:text-base" // Smaller text on mobile
                onClick={() => navigate('/registry')}
              >
                {t('gis.viewAllProjects')}
              </Button>
            </Card>

            <Card className="gis-card glass-card p-4 sm:p-6"> {/* Reduced padding on mobile */}
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 gradient-text">{t('gis.quickStats')}</h3> {/* Smaller text on mobile */}
              <div className="space-y-3 sm:space-y-4"> {/* Smaller space on mobile */}
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm">{t('gis.totalAreaRestored')}</span> {/* Smaller text on mobile */}
                  <span className="font-semibold text-xs sm:text-sm">2,450 hectares</span> {/* Smaller text on mobile */}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm">{t('gis.co2Sequestered')}</span> {/* Smaller text on mobile */}
                  <span className="font-semibold gradient-sea-text text-xs sm:text-sm"> {/* Smaller text on mobile */}
                    {verifiedProjects.reduce((sum, p) => sum + p.co2Sequestered, 0).toFixed(1) + 't'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm">{t('gis.activeSensors')}</span> {/* Smaller text on mobile */}
                  <span className="font-semibold text-yellow-600 text-xs sm:text-sm">24 online</span> {/* Smaller text on mobile */}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm">{t('gis.biodiversityScore')}</span> {/* Smaller text on mobile */}
                  <span className="font-semibold text-sea-green text-xs sm:text-sm">8.7/10</span> {/* Smaller text on mobile */}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8"> {/* Single column on mobile, smaller gaps */}
          <Card className="gis-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-4 sm:p-6" /* Reduced padding on mobile */
                onClick={() => navigate('/iot-simulation')}>
            <div className="text-center">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-coral rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"> {/* Smaller size on mobile */}
                <Zap className="h-6 sm:h-8 w-6 sm:w-8 text-white" /> {/* Smaller icon on mobile */}
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{t('gis.iotLiveData')}</h3> {/* Smaller text on mobile */}
              <p className="text-muted-foreground text-xs sm:text-sm"> {/* Smaller text on mobile */ }
                {t('gis.viewRealtimeData')}
              </p>
            </div>
          </Card>

          <Card className="gis-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-4 sm:p-6" /* Reduced padding on mobile */
                onClick={() => navigate('/analytics')}>
            <div className="text-center">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-sea rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"> {/* Smaller size on mobile */}
                <Activity className="h-6 sm:h-8 w-6 sm:w-8 text-white" /> {/* Smaller icon on mobile */}
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{t('gis.analyticsHub')}</h3> {/* Smaller text on mobile */}
              <p className="text-muted-foreground text-xs sm:text-sm"> {/* Smaller text on mobile */ }
                {t('gis.analyzeTrends')}
              </p>
            </div>
          </Card>

          <Card className="gis-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-4 sm:p-6" /* Reduced padding on mobile */
                onClick={() => navigate('/3d-visualization')}>
            <div className="text-center">
              <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"> {/* Smaller size on mobile */}
                <Layers className="h-6 sm:h-8 w-6 sm:w-8 text-white" /> {/* Smaller icon on mobile */}
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{t('gis.3dVisualization')}</h3> {/* Smaller text on mobile */}
              <p className="text-muted-foreground text-xs sm:text-sm"> {/* Smaller text on mobile */ }
                {t('gis.exploreImmersive')}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GISMapping;