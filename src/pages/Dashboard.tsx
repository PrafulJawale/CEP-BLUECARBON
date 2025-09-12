import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TreePine, TrendingUp, Coins, Leaf, Plus, BarChart3 } from 'lucide-react';
import { gsap } from 'gsap';
import { useTranslation } from '@/contexts/LanguageContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { projects, getUserProjects } = useData();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Dashboard animations
    gsap.fromTo('.dashboard-card', 
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out', stagger: 0.1 }
    );
  }, [user, navigate]);

  if (!user) return null;

  const userProjects = getUserProjects(user.id);
  const totalCredits = userProjects.reduce((sum, project) => sum + project.creditsGenerated, 0);
  const totalCO2 = userProjects.reduce((sum, project) => sum + project.co2Sequestered, 0);
  const totalTrees = userProjects.reduce((sum, project) => sum + project.treeCount, 0);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-sea-green text-white';
      case 'pending':
        return 'bg-coral text-white';
      default:
        return 'bg-destructive text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface" id="main-content">
      {/* Breadcrumb - UX4G Standard */}
      <div className="bg-muted/30 py-2">
        <div className="container mx-auto px-6">
          <nav className="text-sm text-muted-foreground">
            <span>{t('common.home')}</span> / <span className="text-foreground font-medium">{t('common.dashboard')}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <header className="glass px-6 py-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-1">{t('common.dashboard')}</h1>
              <p className="text-muted-foreground">{t('dashboard.welcomeBack')}, <span className="font-medium text-foreground">{user.username}</span></p>
              <div className="flex items-center mt-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {user.role}
                </span>
                <span className="ml-3 text-sm text-muted-foreground">
                  {t('dashboard.lastLogin')}: {new Date().toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <Button variant="outline" size="sm" onClick={() => navigate('/upload')}>
                {t('dashboard.newProject')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/wallet')}>
                <Coins className="h-4 w-4 mr-2" />
                {t('common.wallet')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="dashboard-card glass-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.projects')}</p>
                  <p className="text-3xl font-bold gradient-text">{userProjects.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-ocean rounded-lg flex items-center justify-center">
                  <TreePine className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="dashboard-card glass-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.co2Sequestered')}</p>
                  <p className="text-3xl font-bold gradient-sea-text">{totalCO2.toFixed(1)}t</p>
                </div>
                <div className="w-12 h-12 bg-gradient-sea rounded-lg flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="dashboard-card glass-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.creditsGenerated')}</p>
                  <p className="text-3xl font-bold gradient-text">{totalCredits}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-coral rounded-lg flex items-center justify-center">
                  <Coins className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="dashboard-card glass-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.treesPlanted')}</p>
                  <p className="text-3xl font-bold gradient-sea-text">{totalTrees.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-ocean rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="dashboard-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => navigate('/upload')}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('dashboard.uploadProject')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('dashboard.uploadProjectDesc')}
              </p>
            </div>
          </Card>

          <Card className="dashboard-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => navigate('/registry')}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-sea rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('dashboard.viewRegistry')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('dashboard.viewRegistryDesc')}
              </p>
            </div>
          </Card>

          <Card className="dashboard-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => navigate('/marketplace')}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('dashboard.carbonMarketplace')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('dashboard.carbonMarketplaceDesc')}
              </p>
            </div>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card className="dashboard-card glass-card">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">{t('dashboard.yourProjects')}</h3>
            {userProjects.length === 0 ? (
              <div className="text-center py-8">
                <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('dashboard.noProjects')}</p>
                <Button variant="ocean" className="mt-4" onClick={() => navigate('/upload')}>
                  {t('dashboard.uploadProject')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {userProjects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 bg-ocean-surface/10 rounded-lg">
                    <div>
                      <h4 className="font-medium">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.treeCount} {t('dashboard.trees')} • {project.co2Sequestered.toFixed(1)}t CO₂
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;