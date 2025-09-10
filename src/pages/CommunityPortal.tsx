import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TreePine, Users, Coins, TrendingUp, Plus, Award } from 'lucide-react';
import { gsap } from 'gsap';

const CommunityPortal = () => {
  const { user } = useAuth();
  const { getUserProjects, listCreditsForSale } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Community portal animations
    gsap.fromTo('.community-card', 
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out', stagger: 0.1 }
    );

    // Progress ring animations
    gsap.fromTo('.progress-ring', 
      { rotation: 0 },
      { rotation: 360, duration: 2, ease: 'power2.out', repeat: -1 }
    );
  }, [user, navigate]);

  if (!user) return null;

  const userProjects = getUserProjects(user.id);
  const totalEarnings = userProjects.reduce((sum, project) => sum + (project.creditsGenerated * 25), 0);
  const verificationRate = userProjects.length > 0 
    ? (userProjects.filter(p => p.verified).length / userProjects.length) * 100 
    : 0;

  const handleListCredits = (projectId: string) => {
    const project = userProjects.find(p => p.id === projectId);
    if (project && project.verified) {
      listCreditsForSale(projectId, Math.floor(project.creditsGenerated * 0.5), 25);
      // Toast notification would be handled by the listCreditsForSale function
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="glass px-6 py-6">
        <div className="container mx-auto">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="h-8 w-8 text-ocean-deep" />
            <h1 className="text-3xl font-bold gradient-text">Community Portal</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome {user.username} • {user.role} • {user.organization || 'Independent'}
          </p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Performance Dashboard */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="community-card glass-card">
            <div className="p-6 text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="progress-ring absolute inset-0 w-20 h-20 border-4 border-ocean-light rounded-full"></div>
                <div className="flex items-center justify-center h-full">
                  <TreePine className="h-8 w-8 text-ocean-deep" />
                </div>
              </div>
              <div className="text-2xl font-bold gradient-text">{userProjects.length}</div>
              <div className="text-sm text-muted-foreground">Active Projects</div>
            </div>
          </Card>

          <Card className="community-card glass-card">
            <div className="p-6 text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 w-20 h-20">
                  <Progress value={verificationRate} className="h-2 w-full" />
                </div>
                <div className="flex items-center justify-center h-full">
                  <Award className="h-8 w-8 text-sea-green" />
                </div>
              </div>
              <div className="text-2xl font-bold gradient-sea-text">{verificationRate.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Verification Rate</div>
            </div>
          </Card>

          <Card className="community-card glass-card">
            <div className="p-6 text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="progress-ring absolute inset-0 w-20 h-20 border-4 border-coral-light rounded-full opacity-30"></div>
                <div className="flex items-center justify-center h-full">
                  <Coins className="h-8 w-8 text-coral" />
                </div>
              </div>
              <div className="text-2xl font-bold gradient-text">
                {userProjects.reduce((sum, p) => sum + p.creditsGenerated, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Credits Earned</div>
            </div>
          </Card>

          <Card className="community-card glass-card">
            <div className="p-6 text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="progress-ring absolute inset-0 w-20 h-20 border-4 border-sea-green-light rounded-full opacity-30"></div>
                <div className="flex items-center justify-center h-full">
                  <TrendingUp className="h-8 w-8 text-sea-green" />
                </div>
              </div>
              <div className="text-2xl font-bold gradient-sea-text">₹{totalEarnings.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Earnings</div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="community-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => navigate('/upload')}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">New Project</h3>
              <p className="text-muted-foreground text-sm">Start a new blue carbon project</p>
            </div>
          </Card>

          <Card className="community-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => navigate('/marketplace')}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-sea rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Sell Credits</h3>
              <p className="text-muted-foreground text-sm">List your credits in marketplace</p>
            </div>
          </Card>

          <Card className="community-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => navigate('/registry')}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">View Registry</h3>
              <p className="text-muted-foreground text-sm">Browse verified projects</p>
            </div>
          </Card>
        </div>

        {/* My Projects */}
        <Card className="community-card glass-card">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-6">My Projects</h3>
            
            {userProjects.length === 0 ? (
              <div className="text-center py-12">
                <TreePine className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">No Projects Yet</h4>
                <p className="text-muted-foreground mb-6">Start by uploading your first blue carbon project</p>
                <Button variant="ocean" onClick={() => navigate('/upload')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {userProjects.map((project) => (
                  <div key={project.id} className="border border-ocean-light/20 rounded-lg p-6 hover:bg-ocean-surface/5 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold mb-2">{project.name}</h4>
                        <p className="text-muted-foreground text-sm mb-3">{project.description}</p>
                        
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Trees Planted:</span>
                            <div className="font-semibold gradient-sea-text">{project.treeCount.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">CO₂ Sequestered:</span>
                            <div className="font-semibold gradient-text">{project.co2Sequestered.toFixed(1)}t</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Credits Generated:</span>
                            <div className="font-semibold gradient-text">{project.creditsGenerated}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Estimated Value:</span>
                            <div className="font-semibold gradient-sea-text">₹{(project.creditsGenerated * 25).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-6 flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'approved' ? 'bg-sea-green text-white' :
                          project.status === 'pending' ? 'bg-coral text-white' :
                          'bg-destructive text-white'
                        }`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                        
                        {project.verified && project.creditsGenerated > 0 && (
                          <Button 
                            variant="sea" 
                            size="sm"
                            onClick={() => handleListCredits(project.id)}
                          >
                            <Coins className="h-3 w-3 mr-1" />
                            Sell Credits
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar for verification */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground">Project Status</span>
                        <span className="text-muted-foreground">
                          {project.status === 'approved' ? '100%' : 
                           project.status === 'pending' ? '60%' : '0%'}
                        </span>
                      </div>
                      <Progress 
                        value={project.status === 'approved' ? 100 : 
                               project.status === 'pending' ? 60 : 0} 
                        className="h-2"
                      />
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

export default CommunityPortal;