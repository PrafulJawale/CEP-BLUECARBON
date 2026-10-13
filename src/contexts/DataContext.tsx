import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { 
  api, 
  calculationApi, 
  creditApi,
  monitoringApi,
  notificationApi,
  type ProjectResponse, 
  type ProjectListResponse, 
  type ProjectCreate, 
  type ProjectUpdate, 
  type ProjectStatusUpdate, 
  type CreditResponse, 
  type CreditListResponse, 
  type TransactionResponse, 
  type MarketplaceListingResponse, 
  type MarketplaceListingListResponse, 
  type VerificationReviewResponse, 
  type VerificationReviewCreate, 
  type VerificationReviewDecision,
  type CarbonCalculationResponse,
  type CarbonCalculationCreate,
  type CarbonCalculationReview,
  type CreditIssuance,
  type MonitoringObservationResponse,
  type MonitoringObservationCreate,
  type MonitoringObservationUpdate,
  type NotificationResponse,
  type NotificationListResponse,
  type NotificationUpdate,
  ApiError, 
  ProjectPaginationSchema, 
  ProjectResponseSchema, 
  CreditListResponseSchema, 
  CreditResponseSchema,
  MarketplaceListingListResponseSchema, 
  VerificationReviewResponseSchema, 
  VerificationReviewCreateSchema, 
  VerificationReviewDecisionSchema,
  CarbonCalculationResponseSchema,
  CarbonCalculationCreateSchema,
  CarbonCalculationReviewSchema,
  CreditIssuanceSchema,
  MonitoringObservationResponseSchema,
  MonitoringObservationCreateSchema,
  MonitoringObservationUpdateSchema,
  NotificationResponseSchema,
  NotificationListResponseSchema,
  NotificationUpdateSchema,
} from '@/lib/api';

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  gpsCoordinates: {
    lat: number;
    lng: number;
  };
  images: string[];
  dataFiles: string[];
  dateCreated: string;
  verified: boolean;
  treeCount: number;
  biomass: number;
  co2Sequestered: number;
  creditsGenerated: number;
  status: 'pending' | 'approved' | 'rejected' | 'draft' | 'under_review' | 'changes_requested' | 'submitted';
}

export interface CarbonCredit {
  id: string;
  projectId: string;
  amount: number;
  price: number;
  sellerId: string;
  buyerId?: string;
  status: 'available' | 'sold' | 'reserved';
  createdAt: string;
}

export interface Transaction {
  id: string;
  creditId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  totalPrice: number;
  timestamp: string;
}

export interface Calculation {
  id: string;
  projectId: string;
  calculatorId: string;
  methodologyName: string;
  methodologyVersion: string;
  methodologyReference: string | null;
  inputParameters: Record<string, unknown>;
  biomassTons: number | null;
  carbonStockTons: number | null;
  co2EquivalentTons: number | null;
  annualSequestrationTons: number | null;
  potentialCredits: number | null;
  unit: string;
  assumptions: string | null;
  limitations: string | null;
  dataProvenance: Record<string, unknown> | null;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  reviewerId: string | null;
  reviewerComments: string | null;
  reviewedAt: string | null;
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Credit {
  id: string;
  projectId: string;
  calculationId: string | null;
  batchId: string;
  quantity: number;
  unit: string;
  vintageYear: number;
  status: string;
  issuedBy: string | null;
  issuedAt: string | null;
  issuanceTxHash: string | null;
  retiredAt: string | null;
  retirementReason: string | null;
  methodologyName: string;
  methodologyVersion: string;
  serialNumberStart: number | null;
  serialNumberEnd: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationReview {
  id: string;
  projectId: string;
  reviewerId: string;
  decision: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments: string | null;
  evidenceReviewed: boolean;
  calculationReviewed: boolean;
  methodologyCompliant: boolean | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationReview {
  id: string;
  projectId: string;
  reviewerId: string;
  decision: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments: string | null;
  evidenceReviewed: boolean;
  calculationReviewed: boolean;
  methodologyCompliant: boolean | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonitoringObservation {
  id: string;
  projectId: string;
  observerId: string;
  observationType: string;
  value: number;
  unit: string;
  source: string;
  quality: string;
  latitude: number | null;
  longitude: number | null;
  depthMeters: number | null;
  observedAt: string;
  evidenceId: string | null;
  notes: string | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId: string | null;
  referenceType: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface DataContextType {
  projects: Project[];
  credits: CarbonCredit[];
  transactions: Transaction[];
  verificationReviews: VerificationReview[];
  calculations: Calculation[];
  backendCredits: Credit[];
  monitoringObservations: MonitoringObservation[];
  notifications: Notification[];
  unreadNotificationCount: number;
  isLoading: boolean;
  error: string | null;
  createProject: (project: Omit<Project, 'id' | 'dateCreated' | 'verified' | 'creditsGenerated' | 'status'>) => Promise<void>;
  approveProject: (projectId: string) => Promise<void>;
  rejectProject: (projectId: string) => Promise<void>;
  listCreditsForSale: (projectId: string, amount: number, price: number) => Promise<void>;
  purchaseCredits: (creditId: string, buyerId: string) => Promise<boolean>;
  getUserProjects: (userId: string) => Project[];
  getAvailableCredits: () => CarbonCredit[];
  refreshProjects: () => Promise<void>;
  createVerificationReview: (projectId: string) => Promise<VerificationReview | null>;
  getProjectReviews: (projectId: string) => Promise<VerificationReview[]>;
  submitReviewDecision: (reviewId: string, decision: VerificationReviewDecision) => Promise<VerificationReview | null>;
  createCalculation: (calculationData: Omit<Calculation, 'id' | 'calculatedAt' | 'createdAt' | 'updatedAt' | 'status' | 'reviewerId' | 'reviewerComments' | 'reviewedAt'>) => Promise<Calculation | null>;
  getProjectCalculations: (projectId: string) => Promise<Calculation[]>;
  submitCalculation: (calculationId: string) => Promise<Calculation | null>;
  reviewCalculation: (calculationId: string, reviewData: CarbonCalculationReview) => Promise<Calculation | null>;
  issueCredits: (issuanceData: CreditIssuance) => Promise<Credit | null>;
  getProjectCredits: (projectId: string) => Promise<Credit[]>;
  createObservation: (observationData: MonitoringObservationCreate) => Promise<MonitoringObservation | null>;
  getProjectObservations: (projectId: string) => Promise<MonitoringObservation[]>;
  updateObservation: (observationId: string, observationData: MonitoringObservationUpdate) => Promise<MonitoringObservation | null>;
  getNotifications: (params?: { is_read?: boolean; type?: string; page?: number; page_size?: number }) => Promise<Notification[]>;
  getUnreadNotificationCount: () => Promise<number>;
  markNotificationAsRead: (notificationId: string) => Promise<Notification | null>;
  markAllNotificationsAsRead: () => Promise<number>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

function mapBackendProjectToFrontend(project: ProjectListResponse | ProjectResponse): Project {
  const description = 'description' in project ? project.description : project.name;
  return {
    id: project.id,
    name: project.name,
    description,
    owner_id: project.owner_id,
    gpsCoordinates: {
      lat: project.latitude,
      lng: project.longitude,
    },
    images: [],
    dataFiles: [],
    dateCreated: project.created_at,
    verified: project.status === 'approved',
    treeCount: 0,
    biomass: 0,
    co2Sequestered: 0,
    creditsGenerated: 0,
    status: project.status as Project['status'],
  };
}

function mapBackendCreditToFrontend(credit: CreditListResponse | CreditResponse): CarbonCredit {
  return {
    id: credit.id,
    projectId: credit.project_id,
    amount: credit.quantity,
    price: 25,
    sellerId: '',
    status: (credit.status === 'issued' || credit.status === 'listed') ? 'available' : 'reserved',
    createdAt: 'created_at' in credit ? credit.created_at : (credit.issued_at || new Date().toISOString()),
  };
}

function mapBackendTransactionToFrontend(transaction: TransactionResponse): Transaction {
  return {
    id: transaction.id,
    creditId: transaction.credit_id,
    buyerId: transaction.buyer_id,
    sellerId: transaction.seller_id,
    amount: transaction.quantity,
    totalPrice: transaction.total_amount,
    timestamp: transaction.created_at,
  };
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [credits, setCredits] = useState<CarbonCredit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [verificationReviews, setVerificationReviews] = useState<VerificationReview[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [backendCredits, setBackendCredits] = useState<Credit[]>([]);
  const [monitoringObservations, setMonitoringObservations] = useState<MonitoringObservation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/projects', ProjectPaginationSchema);
      const mappedProjects = response.items.map(mapBackendProjectToFrontend);
      setProjects(mappedProjects);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load projects';
      setError(message);
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const createProject = async (projectData: Omit<Project, 'id' | 'dateCreated' | 'verified' | 'creditsGenerated' | 'status'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: ProjectCreate = {
        name: projectData.name,
        description: projectData.description,
        ecosystem_type: 'mangrove',
        country: 'India',
        state_province: '',
        district: '',
        latitude: projectData.gpsCoordinates.lat,
        longitude: projectData.gpsCoordinates.lng,
        area_hectares: 100,
      };
      const response = await api.post('/projects', payload, ProjectResponseSchema);
      const newProject = mapBackendProjectToFrontend(response);
      setProjects(prev => [...prev, newProject]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create project';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const approveProject = async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: ProjectStatusUpdate = { status: 'approved' };
      const response = await api.patch(`/projects/${projectId}/status`, payload, ProjectResponseSchema);
      const updatedProject = mapBackendProjectToFrontend(response);
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to approve project';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectProject = async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: ProjectStatusUpdate = { status: 'rejected' };
      const response = await api.patch(`/projects/${projectId}/status`, payload, ProjectResponseSchema);
      const updatedProject = mapBackendProjectToFrontend(response);
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to reject project';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const listCreditsForSale = async (projectId: string, amount: number, price: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      const creditsResponse = await api.get(`/credits?project_id=${projectId}`, CreditListResponseSchema);
      if (creditsResponse && Array.isArray(creditsResponse) && creditsResponse.length > 0) {
        const creditId = creditsResponse[0].id;
        await api.post('/marketplace/listings', {
          credit_id: creditId,
          quantity: amount,
          price_per_unit: price,
          currency: 'USD',
        });
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to list credits';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseCredits = async (creditId: string, buyerId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const listingsResponse = await api.get('/marketplace/listings', MarketplaceListingListResponseSchema);
      if (listingsResponse && Array.isArray(listingsResponse)) {
        const listing = listingsResponse.find((l: MarketplaceListingListResponse) => l.credit_id === creditId);
        if (listing) {
          await api.post('/marketplace/purchase', {
            listing_id: listing.id,
            quantity: listing.quantity,
            price_per_unit: listing.price_per_unit,
            total_amount: listing.total_price,
            currency: listing.currency,
          });
          return true;
        }
      }
      return false;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to purchase credits';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserProjects = (userId: string) => {
    return projects.filter(project => project.owner_id === userId);
  };

  const getAvailableCredits = () => {
    return credits.filter(credit => credit.status === 'available');
  };

  function mapBackendReviewToFrontend(review: VerificationReviewResponse): VerificationReview {
    return {
      id: review.id,
      projectId: review.project_id,
      reviewerId: review.reviewer_id,
      decision: review.decision as VerificationReview['decision'],
      comments: review.comments,
      evidenceReviewed: review.evidence_reviewed,
      calculationReviewed: review.calculation_reviewed,
      methodologyCompliant: review.methodology_compliant,
      reviewedAt: review.reviewed_at,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
    };
  }

  function mapBackendCalculationToFrontend(calc: CarbonCalculationResponse): Calculation {
    const parseJson = (val: string | Record<string, unknown> | null | undefined): Record<string, unknown> | null => {
      if (!val) return null;
      if (typeof val === 'string') {
        try {
          return JSON.parse(val) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
      return val;
    };

    return {
      id: calc.id,
      projectId: calc.project_id,
      calculatorId: calc.calculator_id,
      methodologyName: calc.methodology_name,
      methodologyVersion: calc.methodology_version,
      methodologyReference: calc.methodology_reference,
      inputParameters: parseJson(calc.input_parameters),
      biomassTons: calc.biomass_tons,
      carbonStockTons: calc.carbon_stock_tons,
      co2EquivalentTons: calc.co2_equivalent_tons,
      annualSequestrationTons: calc.annual_sequestration_tons,
      potentialCredits: calc.potential_credits,
      unit: calc.unit,
      assumptions: calc.assumptions,
      limitations: calc.limitations,
      dataProvenance: parseJson(calc.data_provenance),
      status: calc.status as Calculation['status'],
      reviewerId: calc.reviewer_id,
      reviewerComments: calc.reviewer_comments,
      reviewedAt: calc.reviewed_at,
      calculatedAt: calc.calculated_at,
      createdAt: calc.created_at,
      updatedAt: calc.updated_at,
    };
  }

  function mapBackendCreditToBackend(credit: CreditResponse | CreditListResponse): Credit {
    const isFullResponse = 'calculation_id' in credit;
    return {
      id: credit.id,
      projectId: credit.project_id,
      calculationId: isFullResponse ? (credit as CreditResponse).calculation_id : null,
      batchId: credit.batch_id,
      quantity: credit.quantity,
      unit: credit.unit,
      vintageYear: credit.vintage_year,
      status: credit.status,
      issuedBy: isFullResponse ? (credit as CreditResponse).issued_by : null,
      issuedAt: isFullResponse ? (credit as CreditResponse).issued_at : null,
      issuanceTxHash: isFullResponse ? (credit as CreditResponse).issuance_tx_hash : null,
      retiredAt: isFullResponse ? (credit as CreditResponse).retired_at : null,
      retirementReason: isFullResponse ? (credit as CreditResponse).retirement_reason : null,
      methodologyName: credit.methodology_name,
      methodologyVersion: isFullResponse ? (credit as CreditResponse).methodology_version : '',
      serialNumberStart: isFullResponse ? (credit as CreditResponse).serial_number_start : null,
      serialNumberEnd: isFullResponse ? (credit as CreditResponse).serial_number_end : null,
      createdAt: isFullResponse ? (credit as CreditResponse).created_at : new Date().toISOString(),
      updatedAt: isFullResponse ? (credit as CreditResponse).updated_at : new Date().toISOString(),
    };
  }

  function mapBackendObservationToFrontend(obs: MonitoringObservationResponse): MonitoringObservation {
    return {
      id: obs.id,
      projectId: obs.project_id,
      observerId: obs.observer_id,
      observationType: obs.observation_type,
      value: obs.value,
      unit: obs.unit,
      source: obs.source,
      quality: obs.quality,
      latitude: obs.latitude,
      longitude: obs.longitude,
      depthMeters: obs.depth_meters,
      observedAt: obs.observed_at,
      evidenceId: obs.evidence_id,
      notes: obs.notes,
      metadataJson: obs.metadata_json ? JSON.parse(obs.metadata_json) : null,
      createdAt: obs.created_at,
      updatedAt: obs.updated_at,
    };
  }

  function mapBackendNotificationToFrontend(notif: NotificationResponse): Notification {
    return {
      id: notif.id,
      userId: notif.user_id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      referenceId: notif.reference_id,
      referenceType: notif.reference_type,
      isRead: notif.is_read,
      readAt: notif.read_at,
      createdAt: notif.created_at,
    };
  }

  const createVerificationReview = async (projectId: string): Promise<VerificationReview | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: VerificationReviewCreate = { project_id: projectId };
      const response = await api.post('/verification', payload, VerificationReviewResponseSchema);
      const review = mapBackendReviewToFrontend(response);
      setVerificationReviews(prev => [...prev, review]);
      return review;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create verification review';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectReviews = async (projectId: string): Promise<VerificationReview[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/verification/project/${projectId}`, z.array(VerificationReviewResponseSchema));
      const reviews = response.map(mapBackendReviewToFrontend);
      setVerificationReviews(prev => [...prev.filter(r => r.projectId !== projectId), ...reviews]);
      return reviews;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load verification reviews';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const submitReviewDecision = async (reviewId: string, decision: VerificationReviewDecision): Promise<VerificationReview | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post(`/verification/${reviewId}/decision`, decision, VerificationReviewResponseSchema);
      const review = mapBackendReviewToFrontend(response);
      setVerificationReviews(prev => prev.map(r => r.id === reviewId ? review : r));
      await refreshProjects();
      return review;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to submit review decision';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createCalculation = async (calculationData: Omit<Calculation, 'id' | 'calculatedAt' | 'createdAt' | 'updatedAt' | 'status' | 'reviewerId' | 'reviewerComments' | 'reviewedAt'>): Promise<Calculation | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: CarbonCalculationCreate = {
        project_id: calculationData.projectId,
        methodology_name: calculationData.methodologyName,
        methodology_version: calculationData.methodologyVersion,
        methodology_reference: calculationData.methodologyReference,
        input_parameters: calculationData.inputParameters,
        biomass_tons: calculationData.biomassTons,
        carbon_stock_tons: calculationData.carbonStockTons,
        co2_equivalent_tons: calculationData.co2EquivalentTons,
        annual_sequestration_tons: calculationData.annualSequestrationTons,
        potential_credits: calculationData.potentialCredits,
        unit: calculationData.unit,
        assumptions: calculationData.assumptions,
        limitations: calculationData.limitations,
        data_provenance: calculationData.dataProvenance,
      };
      const response = await calculationApi.create(payload, CarbonCalculationResponseSchema);
      const calc = mapBackendCalculationToFrontend(response);
      setCalculations(prev => [...prev, calc]);
      return calc;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create calculation';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectCalculations = async (projectId: string): Promise<Calculation[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await calculationApi.listByProject(projectId, z.array(CarbonCalculationResponseSchema)) as CarbonCalculationResponse[];
      const calcs = response.map(mapBackendCalculationToFrontend);
      setCalculations(prev => [...prev.filter(c => c.projectId !== projectId), ...calcs]);
      return calcs;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load calculations';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const submitCalculation = async (calculationId: string): Promise<Calculation | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await calculationApi.submit(calculationId, CarbonCalculationResponseSchema) as CarbonCalculationResponse;
      const calc = mapBackendCalculationToFrontend(response);
      setCalculations(prev => prev.map(c => c.id === calculationId ? calc : c));
      return calc;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to submit calculation';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reviewCalculation = async (calculationId: string, reviewData: CarbonCalculationReview): Promise<Calculation | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await calculationApi.review(calculationId, reviewData, CarbonCalculationResponseSchema) as CarbonCalculationResponse;
      const calc = mapBackendCalculationToFrontend(response);
      setCalculations(prev => prev.map(c => c.id === calculationId ? calc : c));
      await refreshProjects();
      return calc;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to review calculation';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const issueCredits = async (issuanceData: CreditIssuance): Promise<Credit | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await creditApi.issue(issuanceData, CreditResponseSchema) as CreditResponse;
      const credit = mapBackendCreditToBackend(response);
      setBackendCredits(prev => [...prev, credit]);
      await refreshProjects();
      return credit;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to issue credits';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectCredits = async (projectId: string): Promise<Credit[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await creditApi.listByProject(projectId, z.array(CreditListResponseSchema)) as CreditListResponse[];
      const creds = response.map(mapBackendCreditToBackend);
      setBackendCredits(prev => [...prev.filter(c => c.projectId !== projectId), ...creds]);
      return creds;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load credits';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createObservation = async (observationData: MonitoringObservationCreate): Promise<MonitoringObservation | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await monitoringApi.create(observationData, MonitoringObservationResponseSchema);
      const obs = mapBackendObservationToFrontend(response);
      setMonitoringObservations(prev => [...prev, obs]);
      return obs;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create observation';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectObservations = async (projectId: string): Promise<MonitoringObservation[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await monitoringApi.listByProject(projectId, z.array(MonitoringObservationResponseSchema)) as MonitoringObservationResponse[];
      const obs = response.map(mapBackendObservationToFrontend);
      setMonitoringObservations(prev => [...prev.filter(o => o.projectId !== projectId), ...obs]);
      return obs;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load observations';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const updateObservation = async (observationId: string, observationData: MonitoringObservationUpdate): Promise<MonitoringObservation | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await monitoringApi.update(observationId, observationData, MonitoringObservationResponseSchema);
      const obs = mapBackendObservationToFrontend(response);
      setMonitoringObservations(prev => prev.map(o => o.id === observationId ? obs : o));
      return obs;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update observation';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getNotifications = async (params?: { is_read?: boolean; type?: string; page?: number; page_size?: number }): Promise<Notification[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notificationApi.list(params, z.array(NotificationListResponseSchema)) as NotificationListResponse[];
      const notifs = response.map(mapBackendNotificationToFrontend);
      setNotifications(prev => [...prev.filter(n => !response.some(r => r.id === n.id)), ...notifs]);
      return notifs;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load notifications';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getUnreadNotificationCount = async (): Promise<number> => {
    try {
      const response = await notificationApi.getUnreadCount() as { unread_count: number };
      setUnreadNotificationCount(response.unread_count);
      return response.unread_count;
    } catch (err) {
      console.error('Failed to get unread notification count:', err);
      return 0;
    }
  };

  const markNotificationAsRead = async (notificationId: string): Promise<Notification | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notificationApi.markAsRead(notificationId, NotificationResponseSchema);
      const notif = mapBackendNotificationToFrontend(response);
      setNotifications(prev => prev.map(n => n.id === notificationId ? notif : n));
      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
      return notif;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to mark notification as read';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const markAllNotificationsAsRead = async (): Promise<number> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notificationApi.markAllAsRead() as { marked_read: number };
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadNotificationCount(0);
      return response.marked_read;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to mark all notifications as read';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        projects,
        credits,
        transactions,
        verificationReviews,
        calculations,
        backendCredits,
        monitoringObservations,
        notifications,
        unreadNotificationCount,
        isLoading,
        error,
        createProject,
        approveProject,
        rejectProject,
        listCreditsForSale,
        purchaseCredits,
        getUserProjects,
        getAvailableCredits,
        refreshProjects,
        createVerificationReview,
        getProjectReviews,
        submitReviewDecision,
        createCalculation,
        getProjectCalculations,
        submitCalculation,
        reviewCalculation,
        issueCredits,
        getProjectCredits,
        createObservation,
        getProjectObservations,
        updateObservation,
        getNotifications,
        getUnreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};