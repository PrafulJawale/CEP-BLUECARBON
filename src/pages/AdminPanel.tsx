import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { gsap } from 'gsap';

const AdminPanel = () => {
  const { user } = useAuth();
  const { projects, approveProject, rejectProject } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }

    // Admin panel animations
    gsap.fromTo('.admin-card', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1 }
    );
  }, [user, navigate]);

  const handleApprove = (projectId: string) => {
    approveProject(projectId);
    toast({
      title: "Project approved!",
      description: "The project has been verified and credits have been generated.",
    });
  };

  const handleReject = (projectId: string) => {
    rejectProject(projectId);
    toast({
      title: "Project rejected",
      description: "The project has been rejected and marked as invalid.",
      variant: "destructive",
    });
  };

  if (!user || user.role !== 'Admin') return null;

  const pendingProjects = projects.filter(p => p.status === 'pending');
  const approvedProjects = projects.filter(p => p.status === 'approved');
  const rejectedProjects = projects.filter(p => p.status === 'rejected');

  return (
    <div className="min-h-screen bg-gradient-surface" id="main-content">
      {/* Government Header Pattern - UX4G */}
      <div className="bg-destructive/10 border-b border-destructive/20 py-2">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <Shield className="h-4 w-4 text-destructive mr-2" />
              <span className="text-destructive font-medium">Restricted Access</span>
              <span className="ml-2 text-muted-foreground">• Admin Panel</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Session: {new Date().toLocaleTimeString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-muted/30 py-2">
        <div className="container mx-auto px-6">
          <nav className="text-sm text-muted-foreground">
            <span>Home</span> / <span>Admin</span> / <span className="text-foreground font-medium">Verification Panel</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <header className="glass px-6 py-6">
        <div className="container mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="h-8 w-8 text-ocean-deep" />
                <div>
                  <h1 className="text-3xl font-bold gradient-text">NCCR Admin Panel</h1>
                  <p className="text-sm text-muted-foreground">National Carbon Credit Registry</p>
                </div>
              </div>
              <p className="text-muted-foreground mt-2">Project verification and fraud detection system</p>
            </div>
            
            {/* Admin Actions */}
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="destructive" size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                System Alert
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Dashboard */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="admin-card glass-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-coral">{pendingProjects.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-coral" />
              </div>
            </div>
          </Card>

          <Card className="admin-card glass-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-3xl font-bold text-sea-green">{approvedProjects.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-sea-green" />
              </div>
            </div>
          </Card>

          <Card className="admin-card glass-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-3xl font-bold text-destructive">{rejectedProjects.length}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
          </Card>

          <Card className="admin-card glass-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total CO₂</p>
                  <p className="text-3xl font-bold gradient-text">
                    {projects.reduce((sum, p) => sum + p.co2Sequestered, 0).toFixed(1)}t
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-ocean-deep" />
              </div>
            </div>
          </Card>
        </div>

        {/* Fraud Detection Alerts */}
        <Card className="admin-card glass-card mb-8">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-coral mr-2" />
              Fraud Detection Alerts
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-coral/10 rounded-lg">
                <div>
                  <p className="font-medium">Suspicious GPS coordinates detected</p>
                  <p className="text-sm text-muted-foreground">Project #2 - coordinates may be fabricated</p>
                </div>
                <Badge variant="destructive">High Risk</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-ocean-surface/20 rounded-lg">
                <div>
                  <p className="font-medium">Duplicate image analysis</p>
                  <p className="text-sm text-muted-foreground">Similar images found across multiple projects</p>
                </div>
                <Badge variant="secondary">Medium Risk</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Projects for Review */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold gradient-text">Projects Pending Review</h2>
          
          {pendingProjects.length === 0 ? (
            <Card className="admin-card glass-card">
              <div className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-sea-green mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">No projects pending review at the moment</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingProjects.map((project) => (
                <Card key={project.id} className="admin-card glass-card">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                        <p className="text-muted-foreground mb-3">{project.description}</p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Location:</span>
                            <div>{project.gpsCoordinates.lat.toFixed(4)}, {project.gpsCoordinates.lng.toFixed(4)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Trees:</span>
                            <div className="font-semibold">{project.treeCount.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">CO₂:</span>
                            <div className="font-semibold">{project.co2Sequestered.toFixed(1)}t</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Potential Credits:</span>
                            <div className="font-semibold">{Math.floor(project.co2Sequestered)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button 
                          variant="sea" 
                          size="sm"
                          onClick={() => handleApprove(project.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleReject(project.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>

                    {/* Project Files */}
                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <h4 className="font-medium mb-2">Images ({project.images.length})</h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {project.images.slice(0, 3).map((img, idx) => (
                            <div key={idx}>{img}</div>
                          ))}
                          {project.images.length > 3 && (
                            <div>+{project.images.length - 3} more...</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Data Files ({project.dataFiles.length})</h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {project.dataFiles.slice(0, 3).map((file, idx) => (
                            <div key={idx}>{file}</div>
                          ))}
                          {project.dataFiles.length > 3 && (
                            <div>+{project.dataFiles.length - 3} more...</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">AI Analysis</h4>
                        <div className="text-xs space-y-1">
                          <div className="text-sea-green">✓ Image authenticity verified</div>
                          <div className="text-sea-green">✓ GPS coordinates valid</div>
                          <div className="text-coral">⚠ Manual review required</div>
                        </div>
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

export default AdminPanel;