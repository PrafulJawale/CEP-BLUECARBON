import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData, Project } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Bot, 
  UserCheck, 
  Shield, 
  Coins, 
  CheckCircle, 
  XCircle, 
  Clock,
  Home,
  Eye,
  FileText,
  Zap
} from 'lucide-react';
import { gsap } from 'gsap';

interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp?: string;
}

const VerificationWorkflow = () => {
  const { user } = useAuth();
  const { projects, getUserProjects } = useData();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Animate components on load
    gsap.fromTo('.workflow-card', 
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out', stagger: 0.1 }
    );
  }, [user, navigate]);

  useEffect(() => {
    if (selectedProject) {
      // Animate workflow stages
      gsap.fromTo('.workflow-stage', 
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out', stagger: 0.2 }
      );

      // Animate progress bars
      gsap.fromTo('.progress-fill',
        { width: '0%' },
        { width: '100%', duration: 2, ease: 'power2.out', delay: 0.5 }
      );
    }
  }, [selectedProject]);

  if (!user) return null;

  const userProjects = getUserProjects(user.id);

  const getWorkflowStages = (project: Project): WorkflowStage[] => {
    const stages: WorkflowStage[] = [
      {
        id: 'upload',
        name: 'Data Upload',
        description: 'Upload drone images, satellite data, and IoT measurements',
        icon: <Upload className="h-6 w-6" />,
        status: 'completed',
        timestamp: project.dateCreated,
      },
      {
        id: 'ai_check',
        name: 'AI Validation',
        description: 'Automated verification of data quality and consistency',
        icon: <Bot className="h-6 w-6" />,
        status: project.status === 'pending' ? 'processing' : 'completed',
        timestamp: project.status !== 'pending' ? 
          new Date(new Date(project.dateCreated).getTime() + 3600000).toISOString() : 
          undefined,
      },
      {
        id: 'field_validation',
        name: 'Field Validation',
        description: 'On-ground verification by certified field agents',
        icon: <UserCheck className="h-6 w-6" />,
        status: project.status === 'approved' ? 'completed' : 
               project.status === 'rejected' ? 'failed' : 'pending',
        timestamp: project.status === 'approved' ? 
          new Date(new Date(project.dateCreated).getTime() + 7200000).toISOString() : 
          undefined,
      },
      {
        id: 'admin_approval',
        name: 'Admin Approval',
        description: 'Final review and approval by NCCR administrators',
        icon: <Shield className="h-6 w-6" />,
        status: project.status === 'approved' ? 'completed' : 
               project.status === 'rejected' ? 'failed' : 'pending',
        timestamp: project.verified ? 
          new Date(new Date(project.dateCreated).getTime() + 10800000).toISOString() : 
          undefined,
      },
      {
        id: 'token_minting',
        name: 'Credit Minting',
        description: 'Generate and mint carbon credits on blockchain',
        icon: <Coins className="h-6 w-6" />,
        status: project.creditsGenerated > 0 ? 'completed' : 'pending',
        timestamp: project.creditsGenerated > 0 ? 
          new Date(new Date(project.dateCreated).getTime() + 14400000).toISOString() : 
          undefined,
      },
    ];

    return stages;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-sea-green" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-sea-green bg-sea-green/10';
      case 'failed':
        return 'border-red-500 bg-red-500/10';
      case 'processing':
        return 'border-yellow-500 bg-yellow-500/10';
      default:
        return 'border-muted bg-muted/10';
    }
  };

  const calculateProgress = (stages: WorkflowStage[]) => {
    const completed = stages.filter(s => s.status === 'completed').length;
    return (completed / stages.length) * 100;
  };

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
              <h1 className="text-2xl font-bold gradient-text">Verification Workflow</h1>
              <p className="text-muted-foreground">Project Verification Pipeline</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-ocean-surface">
            <FileText className="h-4 w-4 mr-2" />
            {userProjects.length} Projects
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Project List */}
          <div className="lg:col-span-1">
            <Card className="workflow-card glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 gradient-text">Your Projects</h3>
              <div className="space-y-3">
                {userProjects.map((project) => {
                  const stages = getWorkflowStages(project);
                  const progress = calculateProgress(stages);
                  
                  return (
                    <div 
                      key={project.id}
                      className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                        selectedProject?.id === project.id 
                          ? 'bg-ocean-medium text-white' 
                          : 'bg-ocean-surface/30 hover:bg-ocean-surface/50'
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{project.name}</h4>
                        <Badge 
                          variant="secondary"
                          className={
                            project.status === 'approved' ? 'bg-sea-green text-white' :
                            project.status === 'rejected' ? 'bg-red-500 text-white' :
                            'bg-yellow-500 text-white'
                          }
                        >
                          {project.status}
                        </Badge>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="text-xs opacity-75">
                        Created: {new Date(project.dateCreated).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Workflow Visualization */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <Card className="workflow-card glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold gradient-text">
                    Workflow: {selectedProject.name}
                  </h3>
                  <Badge variant="outline">
                    Project ID: {selectedProject.id}
                  </Badge>
                </div>

                <div className="space-y-6">
                  {getWorkflowStages(selectedProject).map((stage, index) => (
                    <div 
                      key={stage.id}
                      className={`workflow-stage flex items-start space-x-4 p-4 rounded-lg border-2 ${getStatusColor(stage.status)}`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        stage.status === 'completed' ? 'bg-sea-green' :
                        stage.status === 'failed' ? 'bg-red-500' :
                        stage.status === 'processing' ? 'bg-yellow-500' :
                        'bg-muted'
                      } text-white`}>
                        {stage.icon}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-lg">{stage.name}</h4>
                          {getStatusIcon(stage.status)}
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-2">
                          {stage.description}
                        </p>

                        {stage.status === 'processing' && (
                          <div className="mb-2">
                            <div className="flex items-center space-x-2 mb-1">
                              <Zap className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium">Processing...</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="progress-fill bg-yellow-500 h-2 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        )}

                        {stage.timestamp && (
                          <div className="text-xs text-muted-foreground">
                            {stage.status === 'completed' ? 'Completed' : 'Started'}: {' '}
                            {new Date(stage.timestamp).toLocaleString()}
                          </div>
                        )}

                        {stage.status === 'failed' && (
                          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-700">
                            Verification failed. Please review project data and resubmit.
                          </div>
                        )}
                      </div>

                      {index < getWorkflowStages(selectedProject).length - 1 && (
                        <div className={`absolute left-10 mt-16 w-0.5 h-8 ${
                          stage.status === 'completed' ? 'bg-sea-green' : 'bg-muted'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Project Summary */}
                <Card className="mt-6 p-4 bg-ocean-surface/20">
                  <h4 className="font-semibold mb-3">Project Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Tree Count</span>
                      <span className="font-semibold">{selectedProject.treeCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">CO₂ Sequestered</span>
                      <span className="font-semibold">{selectedProject.co2Sequestered.toFixed(1)}t</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Credits Generated</span>
                      <span className="font-semibold">{selectedProject.creditsGenerated}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Verified</span>
                      <span className={`font-semibold ${selectedProject.verified ? 'text-sea-green' : 'text-yellow-600'}`}>
                        {selectedProject.verified ? 'Yes' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </Card>
              </Card>
            ) : (
              <Card className="workflow-card glass-card p-12">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a Project</h3>
                  <p className="text-muted-foreground">
                    Choose a project from the list to view its verification workflow
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card className="workflow-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-6"
                onClick={() => navigate('/upload')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload New Project</h3>
              <p className="text-muted-foreground text-sm">
                Start verification for a new restoration project
              </p>
            </div>
          </Card>

          <Card className="workflow-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-6"
                onClick={() => navigate('/fraud-detection')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Fraud Detection</h3>
              <p className="text-muted-foreground text-sm">
                View AI-powered fraud detection results
              </p>
            </div>
          </Card>

          <Card className="workflow-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-6"
                onClick={() => navigate('/registry')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-sea rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Verified Projects</h3>
              <p className="text-muted-foreground text-sm">
                Browse all verified restoration projects
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VerificationWorkflow;