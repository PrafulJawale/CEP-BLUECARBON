import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData, Project, VerificationReview } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
  Zap,
  AlertCircle,
  Search,
  Loader2,
  FileCheck,
  MessageSquare,
} from 'lucide-react';
import { gsap } from 'gsap';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/LanguageContext';
import { VerificationReviewDecision } from '@/lib/api';

interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp?: string;
}

interface ProjectWithReviews extends Project {
  reviews?: VerificationReview[];
  evidenceCount?: number;
  calculationCount?: number;
}

const VerificationWorkflow = () => {
  const { user } = useAuth();
  const { 
    projects, 
    verificationReviews, 
    isLoading, 
    error, 
    refreshProjects, 
    createVerificationReview, 
    getProjectReviews, 
    submitReviewDecision 
  } = useData();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState<ProjectWithReviews | null>(null);
  const [reviewingProjectId, setReviewingProjectId] = useState<string | null>(null);
  const [submittingDecision, setSubmittingDecision] = useState<string | null>(null);
  const [decisionComments, setDecisionComments] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [currentReview, setCurrentReview] = useState<VerificationReview | null>(null);
  const [decisionForm, setDecisionForm] = useState<VerificationReviewDecision>({
    decision: 'approved',
    comments: '',
    evidence_reviewed: false,
    calculation_reviewed: false,
    methodology_compliant: false,
  });

  const fetchProjectsForReview = useCallback(async () => {
    await refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    gsap.fromTo('.workflow-card', 
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out', stagger: 0.1 }
    );
  }, [user, navigate]);

  useEffect(() => {
    if (selectedProject) {
      gsap.fromTo('.workflow-stage', 
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out', stagger: 0.2 }
      );
      gsap.fromTo('.progress-fill',
        { width: '0%' },
        { width: '100%', duration: 2, ease: 'power2.out', delay: 0.5 }
      );
    }
  }, [selectedProject]);

  const canReview = user?.role === 'admin' || user?.role === 'government_officer';

  const getReviewableProjects = (): ProjectWithReviews[] => {
    if (!canReview) {
      return projects.filter(p => p.status === 'submitted' || p.status === 'under_review' || p.status === 'changes_requested');
    }
    return projects.filter(p => 
      p.status === 'submitted' || p.status === 'under_review' || p.status === 'changes_requested'
    );
  };

  const getProjectReviewsForProject = (projectId: string): VerificationReview[] => {
    return verificationReviews.filter(r => r.projectId === projectId);
  };

  const loadProjectDetails = async (project: ProjectWithReviews) => {
    setSelectedProject(project);
    try {
      const reviews = await getProjectReviews(project.id);
      setSelectedProject(prev => prev ? { ...prev, reviews } : null);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const handleCreateReview = async (projectId: string) => {
    setReviewingProjectId(projectId);
    try {
      const review = await createVerificationReview(projectId);
      if (review) {
        toast({
          title: t('verification.reviewCreated'),
          description: t('verification.reviewCreatedDesc'),
        });
        await loadProjectDetails(selectedProject!);
      }
    } catch (err) {
      console.error('Failed to create review:', err);
    } finally {
      setReviewingProjectId(null);
    }
  };

  const handleOpenDecisionModal = (review: VerificationReview) => {
    setCurrentReview(review);
    setDecisionForm({
      decision: 'approved',
      comments: '',
      evidence_reviewed: false,
      calculation_reviewed: false,
      methodology_compliant: false,
    });
    setShowDecisionModal(true);
  };

  const handleSubmitDecision = async () => {
    if (!currentReview) return;
    setSubmittingDecision(currentReview.id);
    try {
      await submitReviewDecision(currentReview.id, decisionForm);
      toast({
        title: t('verification.decisionSubmitted'),
        description: t('verification.decisionSubmittedDesc'),
      });
      setShowDecisionModal(false);
      setCurrentReview(null);
      if (selectedProject) {
        await loadProjectDetails(selectedProject);
      }
    } catch (err) {
      console.error('Failed to submit decision:', err);
    } finally {
      setSubmittingDecision(null);
    }
  };

  const getWorkflowStages = (project: ProjectWithReviews): WorkflowStage[] => {
    const reviews = project.reviews || [];
    const hasReview = reviews.length > 0;
    const latestReview = reviews[0];
    const isApproved = latestReview?.decision === 'approved';
    const isRejected = latestReview?.decision === 'rejected';
    const isChangesRequested = latestReview?.decision === 'changes_requested';

    const stages: WorkflowStage[] = [
      {
        id: 'upload',
        name: t('verification.stages.upload'),
        description: t('verification.stages.uploadDesc'),
        icon: <Upload className="h-6 w-6" />,
        status: 'completed',
        timestamp: project.dateCreated,
      },
      {
        id: 'ai_check',
        name: t('verification.stages.aiCheck'),
        description: t('verification.stages.aiCheckDesc'),
        icon: <Bot className="h-6 w-6" />,
        status: project.status === 'draft' ? 'pending' : 'completed',
        timestamp: project.status !== 'draft' ? project.dateCreated : undefined,
      },
      {
        id: 'evidence_review',
        name: t('verification.stages.evidenceReview'),
        description: t('verification.stages.evidenceReviewDesc'),
        icon: <FileCheck className="h-6 w-6" />,
        status: hasReview ? (latestReview?.evidenceReviewed ? 'completed' : 'processing') : 'pending',
        timestamp: hasReview && latestReview?.evidenceReviewed ? latestReview.reviewedAt : undefined,
      },
      {
        id: 'calculation_review',
        name: t('verification.stages.calculationReview'),
        description: t('verification.stages.calculationReviewDesc'),
        icon: <Bot className="h-6 w-6" />,
        status: hasReview ? (latestReview?.calculationReviewed ? 'completed' : 'processing') : 'pending',
        timestamp: hasReview && latestReview?.calculationReviewed ? latestReview.reviewedAt : undefined,
      },
      {
        id: 'admin_approval',
        name: t('verification.stages.adminApproval'),
        description: t('verification.stages.adminApprovalDesc'),
        icon: <Shield className="h-6 w-6" />,
        status: isApproved ? 'completed' : isRejected ? 'failed' : hasReview ? 'processing' : 'pending',
        timestamp: (isApproved || isRejected) ? latestReview?.reviewedAt : undefined,
      },
      {
        id: 'credit_issuance',
        name: t('verification.stages.creditIssuance'),
        description: t('verification.stages.creditIssuanceDesc'),
        icon: <Coins className="h-6 w-6" />,
        status: project.creditsGenerated > 0 ? 'completed' : 'pending',
        timestamp: project.creditsGenerated > 0 ? project.dateCreated : undefined,
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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  if (!user) return null;

  const reviewableProjects = getReviewableProjects();

  return (
    <>
      <div className="min-h-screen bg-gradient-surface">
        <header className="glass px-6 py-4">
        <div className="container mt-20 mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text">{t('verification.title')}</h1>
              <p className="text-muted-foreground">{t('verification.subtitle')}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-ocean-surface">
            <FileText className="h-4 w-4 mr-2" />
            {reviewableProjects.length} {t('verification.projectsAwaitingReview')}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="workflow-card glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold gradient-text">{t('verification.projectsForReview')}</h3>
                {canReview && (
                  <Button variant="outline" size="sm" onClick={fetchProjectsForReview} disabled={isLoading}>
                    <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
              
              {isLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-ocean-deep" />
                </div>
              )}

              {!isLoading && reviewableProjects.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">{t('verification.noProjectsForReview')}</h4>
                  <p className="text-muted-foreground text-sm">{t('verification.noProjectsForReviewDesc')}</p>
                </div>
              )}

              <div className="space-y-3">
                {reviewableProjects.map((project) => {
                  const projectReviews = getProjectReviewsForProject(project.id);
                  const hasReview = projectReviews.length > 0;
                  const latestReview = projectReviews[0];
                  const progress = calculateProgress(getWorkflowStages(project));
                  
                  return (
                    <div 
                      key={project.id}
                      className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                        selectedProject?.id === project.id 
                          ? 'bg-ocean-medium text-white' 
                          : 'bg-ocean-surface/30 hover:bg-ocean-surface/50'
                      }`}
                      onClick={() => loadProjectDetails(project)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{project.name}</h4>
                        <Badge 
                          variant="secondary"
                          className={
                            project.status === 'approved' ? 'bg-sea-green text-white' :
                            project.status === 'rejected' ? 'bg-red-500 text-white' :
                            project.status === 'under_review' ? 'bg-blue-500 text-white' :
                            project.status === 'changes_requested' ? 'bg-orange-500 text-white' :
                            'bg-yellow-500 text-white'
                          }
                        >
                          {project.status}
                        </Badge>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{t('verification.progress')}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between text-xs opacity-75">
                        <span>{t('verification.created')}: {new Date(project.dateCreated).toLocaleDateString()}</span>
                        {hasReview && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {projectReviews.length} {t('verification.reviews')}
                          </span>
                        )}
                      </div>

                      {canReview && !hasReview && (
                        <Button 
                          variant="ocean" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={(e) => { e.stopPropagation(); handleCreateReview(project.id); }}
                          disabled={reviewingProjectId === project.id}
                        >
                          {reviewingProjectId === project.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t('verification.startReview')
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedProject ? (
              <Card className="workflow-card glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold gradient-text">
                    {t('verification.workflowFor')}: {selectedProject.name}
                  </h3>
                  <Badge variant="outline">
                    {t('verification.projectId')}: {selectedProject.id.slice(0, 8)}...
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
                              <span className="text-sm font-medium">{t('verification.processing')}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className="progress-fill bg-yellow-500 h-2 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        )}

                        {stage.timestamp && (
                          <div className="text-xs text-muted-foreground">
                            {t('verification.completed')}: {formatDate(stage.timestamp)}
                          </div>
                        )}

                        {stage.status === 'failed' && (
                          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-700">
                            {t('verification.failedDesc')}
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

                {canReview && selectedProject.reviews && selectedProject.reviews.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">{t('verification.reviewHistory')}</h4>
                    <div className="space-y-3">
                      {selectedProject.reviews.map((review) => (
                        <Card key={review.id} className="glass-card p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">{t('verification.decision')}</p>
                              <Badge 
                                className={
                                  review.decision === 'approved' ? 'bg-sea-green text-white' :
                                  review.decision === 'rejected' ? 'bg-red-500 text-white' :
                                  review.decision === 'changes_requested' ? 'bg-orange-500 text-white' :
                                  'bg-yellow-500 text-white'
                                }
                              >
                                {review.decision}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{t('verification.reviewedAt')}</p>
                              <p className="font-medium">{formatDate(review.reviewedAt)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{t('verification.checks')}</p>
                              <div className="flex gap-2 text-xs">
                                <Badge variant={review.evidenceReviewed ? 'default' : 'outline'}>
                                  <FileCheck className="h-3 w-3 mr-1" /> {t('verification.evidence')}
                                </Badge>
                                <Badge variant={review.calculationReviewed ? 'default' : 'outline'}>
                                  <Bot className="h-3 w-3 mr-1" /> {t('verification.calculation')}
                                </Badge>
                                <Badge variant={review.methodologyCompliant ? 'default' : review.methodologyCompliant === false ? 'destructive' : 'outline'}>
                                  <Shield className="h-3 w-3 mr-1" /> {t('verification.methodology')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {review.comments && (
                            <div className="mt-3 p-2 bg-ocean-surface/30 rounded text-sm">
                              <p className="text-muted-foreground">{t('verification.comments')}: {review.comments}</p>
                            </div>
                          )}
                          {review.decision === 'pending' && canReview && (
                            <Button 
                              variant="ocean" 
                              size="sm" 
                              className="mt-3"
                              onClick={() => handleOpenDecisionModal(review)}
                            >
                              {t('verification.submitDecision')}
                            </Button>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <Card className="mt-6 p-4 bg-ocean-surface/20">
                  <h4 className="font-semibold mb-3">{t('verification.projectSummary')}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">{t('verification.treeCount')}</span>
                      <span className="font-semibold">{selectedProject.treeCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{t('verification.co2Sequestered')}</span>
                      <span className="font-semibold">{selectedProject.co2Sequestered.toFixed(1)}t</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{t('verification.creditsGenerated')}</span>
                      <span className="font-semibold">{selectedProject.creditsGenerated}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{t('verification.verified')}</span>
                      <span className={`font-semibold ${selectedProject.verified ? 'text-sea-green' : 'text-yellow-600'}`}>
                        {selectedProject.verified ? t('common.yes') : t('verification.pending')}
                      </span>
                    </div>
                  </div>
                </Card>
              </Card>
            ) : (
              <Card className="workflow-card glass-card p-12">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('verification.selectProject')}</h3>
                  <p className="text-muted-foreground">
                    {t('verification.selectProjectDesc')}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card className="workflow-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-6"
                onClick={() => navigate('/upload')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('verification.uploadNewProject')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('verification.uploadNewProjectDesc')}
              </p>
            </div>
          </Card>

          <Card className="workflow-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-6"
                onClick={() => navigate('/fraud-detection')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-coral rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('verification.fraudDetection')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('verification.fraudDetectionDesc')}
              </p>
            </div>
          </Card>

          <Card className="workflow-card glass-card hover:scale-105 transition-transform duration-300 cursor-pointer p-6"
                onClick={() => navigate('/registry')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-sea rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('verification.verifiedProjects')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('verification.verifiedProjectsDesc')}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>

    {showDecisionModal && currentReview && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="w-full max-w-md p-6 glass-card">
          <h3 className="text-xl font-semibold mb-4">{t('verification.submitDecisionTitle')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('verification.submitDecisionDesc')} <strong>{currentReview.id.slice(0, 8)}...</strong>
</p>
           
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium mb-2">{t('verification.decision')}</label>
               <Select
                 value={decisionForm.decision}
                 onValueChange={(value) => setDecisionForm(prev => ({ ...prev, decision: value as VerificationReviewDecision['decision'] }))}
               >
                 <SelectTrigger className="w-full">
                   <SelectValue placeholder={t('verification.selectDecision')} />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="approved">{t('verification.decisionApproved')}</SelectItem>
                   <SelectItem value="rejected">{t('verification.decisionRejected')}</SelectItem>
                   <SelectItem value="changes_requested">{t('verification.decisionChangesRequested')}</SelectItem>
                 </SelectContent>
               </Select>
             </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('verification.comments')}</label>
              <textarea
                value={decisionForm.comments}
                onChange={(e) => setDecisionForm(prev => ({ ...prev, comments: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ocean-deep"
                rows={3}
                placeholder={t('verification.commentsPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">{t('verification.checks')}</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={decisionForm.evidence_reviewed}
                    onChange={(e) => setDecisionForm(prev => ({ ...prev, evidence_reviewed: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{t('verification.evidenceReviewed')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={decisionForm.calculation_reviewed}
                    onChange={(e) => setDecisionForm(prev => ({ ...prev, calculation_reviewed: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{t('verification.calculationReviewed')}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={decisionForm.methodology_compliant === true}
                    onChange={(e) => setDecisionForm(prev => ({ ...prev, methodology_compliant: e.target.checked }))}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{t('verification.methodologyCompliant')}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowDecisionModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="ocean" 
              onClick={handleSubmitDecision}
              disabled={submittingDecision === currentReview.id}
            >
              {submittingDecision === currentReview.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('verification.submit')
              )}
            </Button>
          </div>
        </Card>
      </div>
    )}
    </>
  );
};

export default VerificationWorkflow;