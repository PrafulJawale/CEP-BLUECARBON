import React, { useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TreePine, Leaf, Calendar, CheckCircle } from 'lucide-react';
import { gsap } from 'gsap';
import { useTranslation } from '@/contexts/LanguageContext';

const Registry = () => {
  const { projects, isLoading, error, refreshProjects } = useData();
  const { t } = useTranslation();

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

  if (isLoading && verifiedProjects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-ocean-deep border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">{t('registry.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && verifiedProjects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={refreshProjects}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="glass px-4 sm:px-6 py-6 sm:py-8"> {/* Reduced padding on mobile */}
        <div className="container mt-20 mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-3 sm:mb-4"> {/* Smaller text on mobile */}
            Blockchain Registry
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"> {/* Smaller text on mobile */}
            Transparent, verified blue carbon projects registered on the blockchain
          </p>
          
          {/* Floating Credit Tokens Animation */}
          <div className="relative mt-6 sm:mt-8 h-16 sm:h-20 overflow-hidden"> {/* Smaller height on mobile */}
            <div className="floating-token absolute top-0 left-1/4 w-6 sm:w-8 h-6 sm:h-8 bg-gradient-ocean rounded-full opacity-20 animate-float"></div> {/* Smaller size on mobile */}
            <div className="floating-token absolute top-2 right-1/3 w-4 sm:w-6 h-4 sm:h-6 bg-gradient-sea rounded-full opacity-30 animate-float" style={{animationDelay: '1s'}}></div> {/* Smaller size on mobile */}
            <div className="floating-token absolute top-4 left-1/2 w-8 sm:w-10 h-8 sm:h-10 bg-gradient-coral rounded-full opacity-25 animate-float" style={{animationDelay: '2s'}}></div> {/* Smaller size on mobile */}
          </div>
        </div>
      </header>

      {/* Error/Loading Status */}
      {error && !isLoading && (
        <div className="container mx-auto px-4 sm:px-6 mb-4">
          <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={refreshProjects} disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-1">
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                  {t('common.loading')}
                </span>
              ) : (
                t('common.retry')
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8"> {/* Reduced padding on mobile */}
        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12"> {/* Single column on mobile, smaller gaps */}
          <Card className="registry-card glass-card text-center">
            <div className="p-4 sm:p-6"> {/* Reduced padding on mobile */}
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-1 sm:mb-2"> {/* Smaller text on mobile */}
                {verifiedProjects.length}
              </div>
              <div className="text-sm sm:text-base text-muted-foreground">Verified Projects</div> {/* Smaller text on mobile */}
            </div>
          </Card>

          <Card className="registry-card glass-card text-center">
            <div className="p-4 sm:p-6"> {/* Reduced padding on mobile */}
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-sea-text mb-1 sm:mb-2"> {/* Smaller text on mobile */}
                {verifiedProjects.reduce((sum, p) => sum + p.creditsGenerated, 0).toLocaleString()}
              </div>
              <div className="text-sm sm:text-base text-muted-foreground">Credits Minted</div> {/* Smaller text on mobile */}
            </div>
          </Card>

          <Card className="registry-card glass-card text-center">
            <div className="p-4 sm:p-6"> {/* Reduced padding on mobile */}
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-1 sm:mb-2"> {/* Smaller text on mobile */}
                {verifiedProjects.reduce((sum, p) => sum + p.co2Sequestered, 0).toFixed(1)}t
              </div>
              <div className="text-sm sm:text-base text-muted-foreground">CO₂ Sequestered</div> {/* Smaller text on mobile */}
            </div>
          </Card>
        </div>

        {/* Project Registry */}
        <div className="space-y-4 sm:space-y-6"> {/* Smaller space on mobile */}
          <h2 className="text-xl sm:text-2xl font-bold gradient-text">Registered Projects</h2> {/* Smaller text on mobile */}
          
          {verifiedProjects.length === 0 ? (
            <Card className="registry-card glass-card">
              <div className="p-8 sm:p-12 text-center"> {/* Reduced padding on mobile */}
                <TreePine className="h-12 sm:h-16 w-12 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" /> {/* Smaller icon on mobile */}
                <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">No Verified Projects Yet</h3> {/* Smaller text on mobile */}
                <p className="text-sm sm:text-base text-muted-foreground"> {/* Smaller text on mobile */}
                  Projects are currently being reviewed for verification
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"> {/* Single column on mobile, smaller gaps */}
              {verifiedProjects.map((project) => (
                <Card key={project.id} className="registry-card glass-card hover:scale-[1.02] transition-transform duration-300">
                  <div className="p-4 sm:p-6"> {/* Reduced padding on mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4"> {/* Stack vertically on mobile */}
                      <div className="mb-2 sm:mb-0">
                        <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">{project.name}</h3> {/* Smaller text on mobile */}
                        <p className="text-sm sm:text-base text-muted-foreground mb-2 sm:mb-3">{project.description}</p> {/* Smaller text on mobile */}
                      </div>
                      <Badge variant="secondary" className="bg-sea-green text-white self-start sm:self-auto"> {/* Align to start on mobile */ }
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4"> {/* Single column on mobile */}
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 text-ocean-deep mr-2 flex-shrink-0" />
                        <span className="break-words"> {/* Allow word breaking */} 
                          {`${project.gpsCoordinates.lat.toFixed(4)}, ${project.gpsCoordinates.lng.toFixed(4)}`}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 text-ocean-deep mr-2 flex-shrink-0" />
                        <span>{new Date(project.dateCreated).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4"> {/* Smaller gaps on mobile */}
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <TreePine className="h-3 sm:h-4 w-3 sm:w-4 text-sea-green mr-1" /> {/* Smaller icon on mobile */}
                        </div>
                        <div className="text-base sm:text-lg font-semibold gradient-sea-text"> {/* Smaller text on mobile */}
                          {project.treeCount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Trees</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Leaf className="h-3 sm:h-4 w-3 sm:w-4 text-ocean-medium mr-1" /> {/* Smaller icon on mobile */}
                        </div>
                        <div className="text-base sm:text-lg font-semibold gradient-text"> {/* Smaller text on mobile */}
                          {project.co2Sequestered.toFixed(1)}t
                        </div>
                        <div className="text-xs text-muted-foreground">CO₂</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <div className="w-3 sm:w-4 h-3 sm:h-4 bg-gradient-coral rounded-full mr-1"></div> {/* Smaller size on mobile */}
                        </div>
                        <div className="text-base sm:text-lg font-semibold gradient-text"> {/* Smaller text on mobile */}
                          {project.creditsGenerated}
                        </div>
                        <div className="text-xs text-muted-foreground">Credits</div>
                      </div>
                    </div>

                    {/* Blockchain Hash (Simulated) */}
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-ocean-surface/10 rounded-lg"> {/* Reduced padding on mobile */}
                      <div className="text-xs text-muted-foreground mb-1">Blockchain Hash (Simulated):</div>
                      <div className="font-mono text-xs text-ocean-deep break-all"> {/* Allow breaking for long hashes */}
                        0x{project.id.padStart(8, '0')}...simulated
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