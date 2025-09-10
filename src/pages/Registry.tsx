import React, { useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TreePine, Leaf, Calendar, CheckCircle } from 'lucide-react';
import { gsap } from 'gsap';

const Registry = () => {
  const { projects } = useData();

  useEffect(() => {
    // Page animations
    gsap.fromTo('.registry-card', 
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out', stagger: 0.1 }
    );

    gsap.fromTo('.floating-token', 
      { opacity: 0, scale: 0 },
      { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)', stagger: 0.2 }
    );
  }, []);

  const verifiedProjects = projects.filter(project => project.verified);

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="glass px-6 py-8">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold gradient-text mb-4">Blockchain Registry</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transparent, verified blue carbon projects registered on the blockchain
          </p>
          
          {/* Floating Credit Tokens Animation */}
          <div className="relative mt-8 h-20 overflow-hidden">
            <div className="floating-token absolute top-0 left-1/4 w-8 h-8 bg-gradient-ocean rounded-full opacity-20 animate-float"></div>
            <div className="floating-token absolute top-2 right-1/3 w-6 h-6 bg-gradient-sea rounded-full opacity-30 animate-float" style={{animationDelay: '1s'}}></div>
            <div className="floating-token absolute top-4 left-1/2 w-10 h-10 bg-gradient-coral rounded-full opacity-25 animate-float" style={{animationDelay: '2s'}}></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="registry-card glass-card text-center">
            <div className="p-6">
              <div className="text-4xl font-bold gradient-text mb-2">
                {verifiedProjects.length}
              </div>
              <div className="text-muted-foreground">Verified Projects</div>
            </div>
          </Card>

          <Card className="registry-card glass-card text-center">
            <div className="p-6">
              <div className="text-4xl font-bold gradient-sea-text mb-2">
                {verifiedProjects.reduce((sum, p) => sum + p.creditsGenerated, 0).toLocaleString()}
              </div>
              <div className="text-muted-foreground">Credits Minted</div>
            </div>
          </Card>

          <Card className="registry-card glass-card text-center">
            <div className="p-6">
              <div className="text-4xl font-bold gradient-text mb-2">
                {verifiedProjects.reduce((sum, p) => sum + p.co2Sequestered, 0).toFixed(1)}t
              </div>
              <div className="text-muted-foreground">CO₂ Sequestered</div>
            </div>
          </Card>
        </div>

        {/* Project Registry */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold gradient-text">Registered Projects</h2>
          
          {verifiedProjects.length === 0 ? (
            <Card className="registry-card glass-card">
              <div className="p-12 text-center">
                <TreePine className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Verified Projects Yet</h3>
                <p className="text-muted-foreground">
                  Projects are currently being reviewed for verification
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {verifiedProjects.map((project) => (
                <Card key={project.id} className="registry-card glass-card hover:scale-[1.02] transition-transform duration-300">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                        <p className="text-muted-foreground text-sm mb-3">{project.description}</p>
                      </div>
                      <Badge variant="secondary" className="bg-sea-green text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 text-ocean-deep mr-2" />
                        <span>
                          {project.gpsCoordinates.lat.toFixed(4)}, {project.gpsCoordinates.lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 text-ocean-deep mr-2" />
                        <span>{new Date(project.dateCreated).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <TreePine className="h-4 w-4 text-sea-green mr-1" />
                        </div>
                        <div className="text-lg font-semibold gradient-sea-text">
                          {project.treeCount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Trees</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Leaf className="h-4 w-4 text-ocean-medium mr-1" />
                        </div>
                        <div className="text-lg font-semibold gradient-text">
                          {project.co2Sequestered.toFixed(1)}t
                        </div>
                        <div className="text-xs text-muted-foreground">CO₂</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-4 h-4 bg-gradient-coral rounded-full mr-1"></div>
                        </div>
                        <div className="text-lg font-semibold gradient-text">
                          {project.creditsGenerated}
                        </div>
                        <div className="text-xs text-muted-foreground">Credits</div>
                      </div>
                    </div>

                    {/* Blockchain Hash Simulation */}
                    <div className="mt-4 p-3 bg-ocean-surface/10 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Blockchain Hash:</div>
                      <div className="font-mono text-xs text-ocean-deep">
                        0x{Math.random().toString(16).substr(2, 8)}...{Math.random().toString(16).substr(2, 8)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Registry;