import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Layers, Satellite, Activity, Home, Zap, ZoomIn, ZoomOut } from 'lucide-react';
import { gsap } from 'gsap';

// Simple 3D Map Component (without mapbox for demo)
const InteractiveMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedLayer, setSelectedLayer] = useState<'satellite' | 'drone' | 'heatmap'>('satellite');
  const [zoom, setZoom] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 500;

    // Clear canvas
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw coastline
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.quadraticCurveTo(200, 80, 300, 120);
    ctx.quadraticCurveTo(400, 150, 500, 130);
    ctx.quadraticCurveTo(600, 110, 700, 140);
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
      ctx.arc(site.x, site.y, site.size * (zoom / 5), 0, Math.PI * 2);
      ctx.fill();

      // Site marker
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(site.x, site.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.fillText(site.name, site.x - 20, site.y - site.size * (zoom / 5) - 10);
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
        ctx.arc(sensor.x, sensor.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Pulsing effect
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sensor.x, sensor.y, 8, 0, Math.PI * 2);
        ctx.stroke();
      });
    }

  }, [selectedLayer, zoom]);

  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        className="w-full rounded-lg border border-ocean-surface bg-ocean-deep"
        style={{ maxWidth: '800px', height: '500px' }}
      />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="ocean"
          size="sm"
          onClick={() => setZoom(Math.min(10, zoom + 1))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ocean"
          size="sm"
          onClick={() => setZoom(Math.max(1, zoom - 1))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Layer Controls */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <Button
          variant={selectedLayer === 'satellite' ? 'ocean' : 'outline'}
          size="sm"
          onClick={() => setSelectedLayer('satellite')}
        >
          <Satellite className="h-4 w-4 mr-2" />
          Satellite
        </Button>
        <Button
          variant={selectedLayer === 'drone' ? 'ocean' : 'outline'}
          size="sm"
          onClick={() => setSelectedLayer('drone')}
        >
          <Zap className="h-4 w-4 mr-2" />
          Drone
        </Button>
        <Button
          variant={selectedLayer === 'heatmap' ? 'ocean' : 'outline'}
          size="sm"
          onClick={() => setSelectedLayer('heatmap')}
        >
          <Activity className="h-4 w-4 mr-2" />
          Heatmap
        </Button>
      </div>

      <div className="absolute bottom-4 right-4 bg-black/20 backdrop-blur-sm text-white px-3 py-1 rounded text-sm">
        Zoom: {zoom}x
      </div>
    </div>
  );
};

const GISMapping = () => {
  const { user } = useAuth();
  const { projects } = useData();
  const navigate = useNavigate();
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
      <header className="glass px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text">GIS Mapping</h1>
              <p className="text-muted-foreground">Geospatial View of Blue Carbon Projects</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-ocean-surface">
            <MapPin className="h-4 w-4 mr-2" />
            {verifiedProjects.length} Active Sites
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="gis-card glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold gradient-text">Interactive Map</h3>
                <div className="flex items-center space-x-2">
                  <Layers className="h-5 w-5 text-ocean-medium" />
                  <span className="text-sm text-muted-foreground">Multiple Layers</span>
                </div>
              </div>
              
              <div className="map-container">
                <InteractiveMap />
              </div>

              {/* Map Legend */}
              <div className="mt-4 p-4 bg-ocean-surface/20 rounded-lg">
                <h4 className="font-medium mb-2">Legend</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-sea-green rounded-full"></div>
                    <span>Restoration Sites</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-destructive rounded-full"></div>
                    <span>Project Centers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span>IoT Sensors</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-ocean-medium rounded-full"></div>
                    <span>Water Bodies</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Project List */}
          <div className="space-y-6">
            <Card className="gis-card glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 gradient-text">Active Projects</h3>
              <div className="space-y-3">
                {verifiedProjects.slice(0, 5).map((project) => (
                  <div 
                    key={project.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                      selectedProject === project.id 
                        ? 'bg-ocean-medium text-white' 
                        : 'bg-ocean-surface/30 hover:bg-ocean-surface/50'
                    }`}
                    onClick={() => setSelectedProject(
                      selectedProject === project.id ? null : project.id
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{project.name}</h4>
                        <p className="text-xs opacity-75 mt-1">
                          {project.gpsCoordinates.lat.toFixed(4)}, {project.gpsCoordinates.lng.toFixed(4)}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs">
                          <span>{project.treeCount} trees</span>
                          <span>{project.co2Sequestered.toFixed(1)}t CO₂</span>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-sea-green text-white"
                      >
                        Verified
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="ocean" 
                className="w-full mt-4"
                onClick={() => navigate('/registry')}
              >
                View All Projects
              </Button>
            </Card>

            <Card className="gis-card glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 gradient-text">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Area Restored</span>
                  <span className="font-semibold">2,450 hectares</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">CO₂ Sequestered</span>
                  <span className="font-semibold gradient-sea-text">
                    {verifiedProjects.reduce((sum, p) => sum + p.co2Sequestered, 0).toFixed(1)}t
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Sensors</span>
                  <span className="font-semibold text-yellow-600">24 online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Biodiversity Score</span>
                  <span className="font-semibold text-sea-green">8.7/10</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card className="gis-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-6"
                onClick={() => navigate('/iot-simulation')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">IoT Live Data</h3>
              <p className="text-muted-foreground text-sm">
                View real-time sensor data from restoration sites
              </p>
            </div>
          </Card>

          <Card className="gis-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-6"
                onClick={() => navigate('/analytics')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-sea rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Analytics Hub</h3>
              <p className="text-muted-foreground text-sm">
                Analyze trends and generate reports
              </p>
            </div>
          </Card>

          <Card className="gis-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-6"
                onClick={() => navigate('/3d-visualization')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3D Visualization</h3>
              <p className="text-muted-foreground text-sm">
                Explore projects in immersive 3D view
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GISMapping;