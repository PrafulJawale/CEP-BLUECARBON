import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData, Project, Calculation } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  Plus, 
  Edit, 
  Eye, 
  Send, 
  RotateCcw,
  Home,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { gsap } from 'gsap';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/LanguageContext';

const CalculationManager = () => {
  const { user } = useAuth();
  const { 
    projects, 
    calculations, 
    isLoading, 
    error, 
    refreshProjects,
    createCalculation, 
    getProjectCalculations, 
    submitCalculation, 
    reviewCalculation 
  } = useData();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingCalculation, setCreatingCalculation] = useState(false);
  const [submittingCalculationId, setSubmittingCalculationId] = useState<string | null>(null);
  const [reviewingCalculationId, setReviewingCalculationId] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReviewCalculation, setCurrentReviewCalculation] = useState<Calculation | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewComments, setReviewComments] = useState('');
  const [expandedCalculation, setExpandedCalculation] = useState<string | null>(null);

  const canCreateCalculations = user?.role === 'project_developer' || user?.role === 'admin' || user?.role === 'government_officer';
  const canReviewCalculations = user?.role === 'admin' || user?.role === 'government_officer';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    gsap.fromTo('.calc-card', 
      { opacity: 0, y: 20, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out', stagger: 0.1 }
    );
  }, [user, navigate]);

  const userProjects = projects.filter(p => p.owner_id === user?.id);
  const eligibleProjects = userProjects.filter(p => p.status === 'approved');

  const projectCalculations = selectedProject 
    ? calculations.filter(c => c.projectId === selectedProject.id)
    : [];

  const handleCreateCalculation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProject) return;

    const formData = new FormData(e.currentTarget);
    const methodologyName = formData.get('methodologyName') as string;
    const methodologyVersion = formData.get('methodologyVersion') as string;
    const methodologyReference = formData.get('methodologyReference') as string;
    const inputParameters = formData.get('inputParameters') as string;
    const assumptions = formData.get('assumptions') as string;
    const limitations = formData.get('limitations') as string;

    if (!methodologyName || !methodologyVersion) {
      toast({
        title: t('calculation.methodologyRequired'),
        description: t('calculation.methodologyRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    let parsedInputParams: Record<string, unknown> = {};
    try {
      parsedInputParams = JSON.parse(inputParameters || '{}');
    } catch {
      toast({
        title: t('calculation.invalidJson'),
        description: t('calculation.invalidJsonDesc'),
        variant: 'destructive',
      });
      return;
    }

    setCreatingCalculation(true);
    try {
      const calc = await createCalculation({
        projectId: selectedProject.id,
        methodologyName,
        methodologyVersion,
        methodologyReference,
        inputParameters: parsedInputParams,
        assumptions,
        limitations,
        unit: 'tCO2e',
        calculatorId: user.id,
        biomassTons: null,
        carbonStockTons: null,
        co2EquivalentTons: null,
        annualSequestrationTons: null,
        potentialCredits: null,
        dataProvenance: null,
      });
      if (calc) {
        toast({
          title: t('calculation.created'),
          description: t('calculation.createdDesc'),
        });
        setShowCreateModal(false);
        (e.target as HTMLFormElement).reset();
      }
    } catch (err) {
      console.error('Failed to create calculation:', err);
    } finally {
      setCreatingCalculation(false);
    }
  };

  const handleSubmitCalculation = async (calculationId: string) => {
    setSubmittingCalculationId(calculationId);
    try {
      const calc = await submitCalculation(calculationId);
      if (calc) {
        toast({
          title: t('calculation.submitted'),
          description: t('calculation.submittedDesc'),
        });
      }
    } catch (err) {
      console.error('Failed to submit calculation:', err);
    } finally {
      setSubmittingCalculationId(null);
    }
  };

  const handleOpenReviewModal = (calculation: Calculation) => {
    setCurrentReviewCalculation(calculation);
    setReviewDecision('approved');
    setReviewComments('');
    setShowReviewModal(true);
  };

  const handleReviewCalculation = async () => {
    if (!currentReviewCalculation) return;
    setReviewingCalculationId(currentReviewCalculation.id);
    try {
      const calc = await reviewCalculation(currentReviewCalculation.id, {
        status: reviewDecision,
        reviewer_comments: reviewComments,
      });
      if (calc) {
        toast({
          title: t('calculation.reviewed'),
          description: `${t('calculation.reviewedDesc')}: ${reviewDecision}`,
        });
        setShowReviewModal(false);
      }
    } catch (err) {
      console.error('Failed to review calculation:', err);
    } finally {
      setReviewingCalculationId(null);
    }
  };

  const loadCalculationsForProject = async (project: Project) => {
    setSelectedProject(project);
    await getProjectCalculations(project.id);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      submitted: 'outline',
      under_review: 'default',
      approved: 'default',
      rejected: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {t(`calculation.status.${status}`) || status}
      </Badge>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="glass px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text">{t('calculation.title')}</h1>
              <p className="text-muted-foreground">{t('calculation.subtitle')}</p>
            </div>
          </div>
          {canCreateCalculations && eligibleProjects.length > 0 && (
            <Button variant="ocean" onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('calculation.createNew')}
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Project Selector */}
          <div className="lg:col-span-1">
            <Card className="calc-card glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 gradient-text">{t('calculation.selectProject')}</h3>
              
              {isLoading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-ocean-deep border-t-transparent rounded-full" />
                </div>
              )}

              {!isLoading && eligibleProjects.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">{t('calculation.noEligibleProjects')}</h4>
                  <p className="text-muted-foreground text-sm">{t('calculation.noEligibleProjectsDesc')}</p>
                </div>
              )}

              <div className="space-y-3">
                {eligibleProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                      selectedProject?.id === project.id 
                        ? 'bg-ocean-medium text-white' 
                        : 'bg-ocean-surface/30 hover:bg-ocean-surface/50'
                    }`}
                    onClick={() => loadCalculationsForProject(project)}
                  >
                    <h4 className="font-medium text-sm">{project.name}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="default" className="text-xs">
                        {project.status}
                      </Badge>
                      <span className="text-xs opacity-75">
                        {projectCalculations.length} {t('calculation.calculations')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Calculations List */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <Card className="calc-card glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold gradient-text">
                    {t('calculation.calculationsFor')}: {selectedProject.name}
                  </h3>
                  {canCreateCalculations && (
                    <Button variant="ocean" onClick={() => setShowCreateModal(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t('calculation.createNew')}
                    </Button>
                  )}
                </div>

                {isLoading && projectCalculations.length === 0 && (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-ocean-deep border-t-transparent rounded-full" />
                  </div>
                )}

                {!isLoading && projectCalculations.length === 0 && (
                  <div className="text-center py-12">
                    <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-medium mb-2">{t('calculation.noCalculations')}</h4>
                    <p className="text-muted-foreground text-sm mb-6">{t('calculation.noCalculationsDesc')}</p>
                    {canCreateCalculations && (
                      <Button variant="ocean" onClick={() => setShowCreateModal(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t('calculation.createFirst')}
                      </Button>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {projectCalculations.map((calc) => (
                    <div 
                      key={calc.id}
                      className={`p-4 rounded-lg border transition-all duration-300 ${
                        expandedCalculation === calc.id ? 'border-ocean-deep bg-ocean-surface/10' : 'border-border bg-ocean-surface/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-lg">{calc.methodologyName} v{calc.methodologyVersion}</h4>
                            {getStatusBadge(calc.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                            <div>
                              <span className="block">{t('calculation.co2Equivalent')}</span>
                              <span className="font-semibold">{calc.co2EquivalentTons?.toLocaleString() || '-'} {calc.unit}</span>
                            </div>
                            <div>
                              <span className="block">{t('calculation.potentialCredits')}</span>
                              <span className="font-semibold">{calc.potentialCredits?.toLocaleString() || '-'}</span>
                            </div>
                            <div>
                              <span className="block">{t('calculation.annualSequestration')}</span>
                              <span className="font-semibold">{calc.annualSequestrationTons?.toLocaleString() || '-'} {calc.unit}/yr</span>
                            </div>
                            <div>
                              <span className="block">{t('calculation.calculatedAt')}</span>
                              <span className="font-semibold">{formatDate(calc.calculatedAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setExpandedCalculation(expandedCalculation === calc.id ? null : calc.id)}
                              className="gap-1"
                            >
                              {expandedCalculation === calc.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <span>{t('calculation.details')}</span>
                            </Button>
                            
                            {calc.status === 'draft' && canCreateCalculations && (
                              <Button 
                                variant="ocean" 
                                size="sm" 
                                onClick={() => handleSubmitCalculation(calc.id)}
                                disabled={submittingCalculationId === calc.id}
                                className="gap-1"
                              >
                                {submittingCalculationId === calc.id ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                                {t('calculation.submitForReview')}
                              </Button>
                            )}
                            
                            {calc.status === 'submitted' && canReviewCalculations && (
                              <Button 
                                variant="sea" 
                                size="sm" 
                                onClick={() => handleOpenReviewModal(calc)}
                                className="gap-1"
                              >
                                <FileText className="h-4 w-4" />
                                {t('calculation.review')}
                              </Button>
                            )}
                            
                            {calc.status === 'approved' && (
                              <Badge variant="default" className="bg-sea-green text-white">
                                {t('calculation.readyForIssuance')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {expandedCalculation === calc.id && (
                        <div className="mt-4 pt-4 border-t border-border space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t('calculation.methodology')}</p>
                              <p className="text-sm font-medium">{calc.methodologyName} v{calc.methodologyVersion}</p>
                              {calc.methodologyReference && (
                                <p className="text-xs text-muted-foreground mt-1">{calc.methodologyReference}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t('calculation.reviewStatus')}</p>
                              <p className="text-sm font-medium">
                                {calc.reviewedAt ? (
                                  <>
                                    {t('calculation.reviewedBy')} {calc.reviewerId?.slice(0, 8)}... 
                                    {t('calculation.on')} {formatDate(calc.reviewedAt)}
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">{t('calculation.notReviewed')}</span>
                                )}
                              </p>
                              {calc.reviewerComments && (
                                <p className="text-xs text-muted-foreground mt-1">{t('calculation.reviewerComments')}: {calc.reviewerComments}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{t('calculation.inputParameters')}</p>
                            <pre className="p-3 bg-background border border-input rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                              {JSON.stringify(calc.inputParameters, null, 2)}
                            </pre>
                          </div>

                          {(calc.assumptions || calc.limitations) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {calc.assumptions && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">{t('calculation.assumptions')}</p>
                                  <p className="text-sm p-3 bg-background border border-input rounded">{calc.assumptions}</p>
                                </div>
                              )}
                              {calc.limitations && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">{t('calculation.limitations')}</p>
                                  <p className="text-sm p-3 bg-background border border-input rounded">{calc.limitations}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="calc-card glass-card p-12">
                <div className="text-center">
                  <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t('calculation.selectProjectPrompt')}</h3>
                  <p className="text-muted-foreground">
                    {t('calculation.selectProjectPromptDesc')}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create Calculation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold gradient-text">{t('calculation.createNew')}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)}>
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleCreateCalculation} className="space-y-6">
                <div>
                  <Label htmlFor="projectSelect">{t('calculation.project')}</Label>
                  <Select value={selectedProject?.id || ''} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder={t('calculation.selectProject')} />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleProjects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">{t('calculation.projectLocked')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="methodologyName">{t('calculation.methodologyName')}</Label>
                    <Input
                      id="methodologyName"
                      name="methodologyName"
                      placeholder={t('calculation.methodologyNamePlaceholder')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="methodologyVersion">{t('calculation.methodologyVersion')}</Label>
                    <Input
                      id="methodologyVersion"
                      name="methodologyVersion"
                      placeholder={t('calculation.methodologyVersionPlaceholder')}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="methodologyReference">{t('calculation.methodologyReference')}</Label>
                  <Input
                    id="methodologyReference"
                    name="methodologyReference"
                    placeholder={t('calculation.methodologyReferencePlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="inputParameters">{t('calculation.inputParameters')}</Label>
                  <Textarea
                    id="inputParameters"
                    name="inputParameters"
                    placeholder='{"area_hectares": 100, "species": "Rhizophora mangle", "age_years": 10}'
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('calculation.inputParametersHelp')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assumptions">{t('calculation.assumptions')}</Label>
                    <Textarea
                      id="assumptions"
                      name="assumptions"
                      placeholder={t('calculation.assumptionsPlaceholder')}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="limitations">{t('calculation.limitations')}</Label>
                    <Textarea
                      id="limitations"
                      name="limitations"
                      placeholder={t('calculation.limitationsPlaceholder')}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button 
                    variant="ocean" 
                    type="submit"
                    disabled={creatingCalculation}
                    className="gap-2"
                  >
                    {creatingCalculation ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Calculator className="h-4 w-4" />
                        {t('calculation.create')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Review Calculation Modal */}
      {showReviewModal && currentReviewCalculation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 glass-card">
            <h3 className="text-xl font-semibold mb-4">{t('calculation.reviewCalculation')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('calculation.reviewCalculationDesc')} <strong>{currentReviewCalculation.methodologyName} v{currentReviewCalculation.methodologyVersion}</strong>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('calculation.decision')}</label>
                <Select
                  value={reviewDecision}
                  onValueChange={(value) => setReviewDecision(value as 'approved' | 'rejected')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('calculation.selectDecision')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">{t('calculation.decisionApproved')}</SelectItem>
                    <SelectItem value="rejected">{t('calculation.decisionRejected')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('calculation.comments')}</label>
                <textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ocean-deep"
                  rows={4}
                  placeholder={t('calculation.commentsPlaceholder')}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowReviewModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                variant="ocean" 
                onClick={handleReviewCalculation}
                disabled={reviewingCalculationId === currentReviewCalculation.id}
              >
                {reviewingCalculationId === currentReviewCalculation.id ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  t('calculation.submitReview')
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CalculationManager;