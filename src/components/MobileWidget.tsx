import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Upload, 
  Settings, 
  Wallet, 
  MapPin, 
  BarChart3, 
  Plus, 
  X 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';

const MobileWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects } = useData();

  const quickActions = [
    {
      name: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      color: 'bg-primary',
      description: 'View overview'
    },
    {
      name: 'Upload Project',
      icon: Upload,
      path: '/upload',
      color: 'bg-sea-green',
      description: 'Add new project'
    },
    {
      name: 'Registry',
      icon: Settings,
      path: '/registry',
      color: 'bg-ocean-medium',
      description: 'Browse projects'
    },
    {
      name: 'Wallet',
      icon: Wallet,
      path: '/wallet',
      color: 'bg-coral',
      description: 'Carbon credits'
    },
    {
      name: 'GIS Mapping',
      icon: MapPin,
      path: '/gis-mapping',
      color: 'bg-accent',
      description: 'Map view'
    },
    {
      name: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      color: 'bg-secondary',
      description: 'View stats'
    }
  ];

  const handleAction = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  // Only show on mobile devices
  const isMobile = window.innerWidth < 768;

  if (!isMobile || !user) return null;

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 shadow-lg transition-all duration-300",
            isOpen ? "rotate-45 scale-110" : "rotate-0 scale-100"
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </Button>
      </div>

      {/* Widget Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <Card className="relative w-full max-w-sm glass-card animate-in slide-in-from-bottom-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <Badge variant="secondary" className="text-xs">
                  {projects.length} Projects
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.path}
                    variant="outline"
                    className={cn(
                      "h-20 flex-col space-y-2 p-3 hover:scale-105 transition-transform",
                      action.color
                    )}
                    onClick={() => handleAction(action.path)}
                  >
                    <action.icon className="h-6 w-6" />
                    <div className="text-center">
                      <div className="text-xs font-medium">{action.name}</div>
                      <div className="text-xs opacity-75">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Tap to navigate • Long press home screen icon for PWA shortcuts
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default MobileWidget;