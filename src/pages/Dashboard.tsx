import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TreePine, TrendingUp, Coins, Leaf, Plus, BarChart3 } from 'lucide-react';
import { gsap } from 'gsap';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { projects, getUserProjects } = useData();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="glass px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.username}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 bg-gradient-ocean text-white rounded-full text-sm">
              {user.role}
            </span>
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
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
                  <p className="text-sm text-muted-foreground">Projects</p>
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
                  <p className="text-sm text-muted-foreground">CO₂ Sequestered</p>
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
                  <p className="text-sm text-muted-foreground">Credits Generated</p>
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
                  <p className="text-sm text-muted-foreground">Trees Planted</p>
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
              <h3 className="text-lg font-semibold mb-2">Upload Project Data</h3>
              <p className="text-muted-foreground text-sm">
                Upload drone images, satellite data, and IoT measurements
              </p>
            </div>
          </Card>

          <Card className="dashboard-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => navigate('/registry')}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-sea rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">View Registry</h3>
              <p className="text-muted-foreground text-sm">
                Browse verified projects and blockchain registry
              </p>
            </div>
          </Card>

          <Card className="dashboard-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => navigate('/marketplace')}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Carbon Marketplace</h3>
              <p className="text-muted-foreground text-sm">
                Buy and sell carbon credits in the marketplace
              </p>
            </div>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card className="dashboard-card glass-card">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Your Projects</h3>
            {userProjects.length === 0 ? (
              <div className="text-center py-8">
                <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No projects yet. Start by uploading your first project data.</p>
                <Button variant="ocean" className="mt-4" onClick={() => navigate('/upload')}>
                  Upload Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {userProjects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 bg-ocean-surface/10 rounded-lg">
                    <div>
                      <h4 className="font-medium">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.treeCount} trees • {project.co2Sequestered.toFixed(1)}t CO₂
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.status === 'approved' ? 'bg-sea-green text-white' :
                        project.status === 'pending' ? 'bg-coral text-white' :
                        'bg-destructive text-white'
                      }`}>
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