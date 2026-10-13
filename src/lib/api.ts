import { z } from 'zod';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response, schema?: z.ZodSchema<T>): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  let data: unknown;
  if (isJson) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = isJson && typeof data === 'object' && data !== null && 'detail' in data
      ? String((data as Record<string, unknown>).detail)
      : response.statusText || 'Request failed';
    throw new ApiError(message, response.status, data);
  }

  if (schema) {
    return schema.parse(data);
  }

  return data as T;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  schema?: z.ZodSchema<T>
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (options.body instanceof FormData) {
    delete (config.headers as Record<string, string>)['Content-Type'];
  }

  try {
    const response = await fetch(url, config);
    return handleResponse(response, schema);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      error
    );
  }
}

export const api = {
  get: <T>(endpoint: string, schema?: z.ZodSchema<T>) =>
    request<T>(endpoint, { method: 'GET' }, schema),

  post: <T>(endpoint: string, body?: unknown, schema?: z.ZodSchema<T>) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }, schema),

  patch: <T>(endpoint: string, body?: unknown, schema?: z.ZodSchema<T>) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }, schema),

  delete: <T>(endpoint: string, schema?: z.ZodSchema<T>) =>
    request<T>(endpoint, { method: 'DELETE' }, schema),

  upload: <T>(endpoint: string, formData: FormData, schema?: z.ZodSchema<T>) =>
    request<T>(endpoint, { method: 'POST', body: formData }, schema),
};

export const calculationApi = {
  create: (body: unknown, schema?: z.ZodSchema<unknown>) =>
    api.post('/calculations', body, schema),

  listByProject: (projectId: string, schema?: z.ZodSchema<unknown>) =>
    api.get(`/calculations/project/${projectId}`, schema),

  get: (calcId: string, schema?: z.ZodSchema<unknown>) =>
    api.get(`/calculations/${calcId}`, schema),

  update: (calcId: string, body: unknown, schema?: z.ZodSchema<unknown>) =>
    api.patch(`/calculations/${calcId}`, body, schema),

  submit: (calcId: string, schema?: z.ZodSchema<unknown>) =>
    api.post(`/calculations/${calcId}/submit`, undefined, schema),

  review: (calcId: string, body: unknown, schema?: z.ZodSchema<unknown>) =>
    api.post(`/calculations/${calcId}/review`, body, schema),
};

export const creditApi = {
  issue: (body: unknown, schema?: z.ZodSchema<unknown>) =>
    api.post('/credits/issue', body, schema),

  listByProject: (projectId: string, schema?: z.ZodSchema<unknown>) =>
    api.get(`/credits/project/${projectId}`, schema),

  get: (creditId: string, schema?: z.ZodSchema<unknown>) =>
    api.get(`/credits/${creditId}`, schema),

  retire: (creditId: string, body: unknown, schema?: z.ZodSchema<unknown>) =>
    api.post(`/credits/${creditId}/retire`, body, schema),
};

export const monitoringApi = {
  create: (body: unknown, schema?: z.ZodSchema<unknown>) =>
    api.post('/monitoring', body, schema),

  listByProject: (projectId: string, schema?: z.ZodSchema<unknown>) =>
    api.get(`/monitoring/project/${projectId}`, schema),

  get: (observationId: string, schema?: z.ZodSchema<unknown>) =>
    api.get(`/monitoring/${observationId}`, schema),

  update: (observationId: string, body: unknown, schema?: z.ZodSchema<unknown>) =>
    api.patch(`/monitoring/${observationId}`, body, schema),
};

export const notificationApi = {
  list: (params?: { is_read?: boolean; type?: string; page?: number; page_size?: number }, schema?: z.ZodSchema<unknown>) => {
    const searchParams = new URLSearchParams();
    if (params?.is_read !== undefined) searchParams.set('is_read', String(params.is_read));
    if (params?.type) searchParams.set('type', params.type);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));
    const query = searchParams.toString();
    return api.get(`/notifications${query ? `?${query}` : ''}`, schema);
  },

  getUnreadCount: (schema?: z.ZodSchema<unknown>) =>
    api.get('/notifications/unread-count', schema),

  get: (notificationId: string, schema?: z.ZodSchema<unknown>) =>
    api.get(`/notifications/${notificationId}`, schema),

  markAsRead: (notificationId: string, schema?: z.ZodSchema<unknown>) =>
    api.patch(`/notifications/${notificationId}/read`, undefined, schema),

  markAllAsRead: (schema?: z.ZodSchema<unknown>) =>
    api.post('/notifications/mark-all-read', undefined, schema),
};

export { ApiError };

export const UserRoleSchema = z.enum([
  'admin',
  'government_officer',
  'project_developer',
  'buyer',
  'researcher',
  'community_representative',
]);

export const UserStatusSchema = z.enum([
  'active',
  'inactive',
  'pending_verification',
  'suspended',
]);

export const ProjectStatusSchema = z.enum([
  'draft',
  'submitted',
  'under_review',
  'changes_requested',
  'approved',
  'rejected',
]);

export const EcosystemTypeSchema = z.enum([
  'mangrove',
  'seagrass',
  'salt_marsh',
  'coastal_wetland',
  'other',
]);

export const EvidenceTypeSchema = z.enum([
  'drone_image',
  'satellite_image',
  'field_photo',
  'document',
  'map',
  'iot_data',
  'other',
]);

export const EvidenceStatusSchema = z.enum([
  'pending',
  'under_review',
  'approved',
  'rejected',
]);

export const CreditStatusSchema = z.enum([
  'proposed',
  'issued',
  'listed',
  'sold',
  'transferred',
  'retired',
  'cancelled',
]);

export const ListingStatusSchema = z.enum([
  'active',
  'sold',
  'cancelled',
  'expired',
]);

export const TransactionStatusSchema = z.enum([
  'pending',
  'completed',
  'failed',
  'cancelled',
  'refunded',
]);

export const CalculationStatusSchema = z.enum([
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
]);

export const VerificationDecisionSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'changes_requested',
]);

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  organization: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.string(),
  status: z.string(),
  last_login_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

export const TokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
});

export type Token = z.infer<typeof TokenSchema>;

export const ProjectResponseSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  ecosystem_type: z.string(),
  country: z.string(),
  state_province: z.string().nullable(),
  district: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  area_hectares: z.number(),
  boundary_geojson: z.record(z.unknown()).nullable(),
  status: z.string(),
  submitted_at: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  approved_at: z.string().nullable(),
  rejected_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  owner: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    full_name: z.string(),
    organization: z.string().nullable(),
  }).nullable(),
});

export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;

export const ProjectListResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ecosystem_type: z.string(),
  country: z.string(),
  state_province: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  area_hectares: z.number(),
  status: z.string(),
  owner_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;

export const ProjectPaginationSchema = z.object({
  items: z.array(ProjectListResponseSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
});

export type ProjectPagination = z.infer<typeof ProjectPaginationSchema>;

export const ProjectCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  ecosystem_type: EcosystemTypeSchema,
  country: z.string().min(1).max(100),
  state_province: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  area_hectares: z.number().positive(),
  boundary_geojson: z.record(z.unknown()).optional(),
});

export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;

export const ProjectUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  ecosystem_type: EcosystemTypeSchema.optional(),
  country: z.string().min(1).max(100).optional(),
  state_province: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  area_hectares: z.number().positive().optional(),
  boundary_geojson: z.record(z.unknown()).optional(),
});

export type ProjectUpdate = z.infer<typeof ProjectUpdateSchema>;

export const ProjectStatusUpdateSchema = z.object({
  status: ProjectStatusSchema,
  comments: z.string().optional(),
});

export type ProjectStatusUpdate = z.infer<typeof ProjectStatusUpdateSchema>;

export const EvidenceResponseSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  uploader_id: z.string().uuid(),
  filename: z.string(),
  original_filename: z.string(),
  file_path: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  checksum: z.string().nullable(),
  evidence_type: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  reviewer_id: z.string().uuid().nullable(),
  reviewer_comments: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  uploaded_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type EvidenceResponse = z.infer<typeof EvidenceResponseSchema>;

export const EvidenceUploadResponseSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  status: z.string(),
  message: z.string(),
});

export type EvidenceUploadResponse = z.infer<typeof EvidenceUploadResponseSchema>;

export const EvidenceReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comments: z.string().optional(),
});

export type EvidenceReview = z.infer<typeof EvidenceReviewSchema>;

export const CarbonCalculationResponseSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  calculator_id: z.string().uuid(),
  methodology_name: z.string(),
  methodology_version: z.string(),
  methodology_reference: z.string().nullable(),
  input_parameters: z.record(z.unknown()),
  biomass_tons: z.number().nullable(),
  carbon_stock_tons: z.number().nullable(),
  co2_equivalent_tons: z.number().nullable(),
  annual_sequestration_tons: z.number().nullable(),
  potential_credits: z.number().nullable(),
  unit: z.string(),
  assumptions: z.string().nullable(),
  limitations: z.string().nullable(),
  data_provenance: z.record(z.unknown()).nullable(),
  status: z.string(),
  reviewer_id: z.string().uuid().nullable(),
  reviewer_comments: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  calculated_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CarbonCalculationResponse = z.infer<typeof CarbonCalculationResponseSchema>;

export const CarbonCalculationCreateSchema = z.object({
  project_id: z.string().uuid(),
  methodology_name: z.string().min(1).max(255),
  methodology_version: z.string().min(1).max(50),
  methodology_reference: z.string().max(512).optional(),
  input_parameters: z.record(z.unknown()),
  biomass_tons: z.number().optional(),
  carbon_stock_tons: z.number().optional(),
  co2_equivalent_tons: z.number().optional(),
  annual_sequestration_tons: z.number().optional(),
  potential_credits: z.number().optional(),
  unit: z.string().default('tCO2e'),
  assumptions: z.string().optional(),
  limitations: z.string().optional(),
  data_provenance: z.record(z.unknown()).optional(),
});

export type CarbonCalculationCreate = z.infer<typeof CarbonCalculationCreateSchema>;

export const CarbonCalculationReviewSchema = z.object({
  status: CalculationStatusSchema,
  reviewer_comments: z.string().optional(),
});

export type CarbonCalculationReview = z.infer<typeof CarbonCalculationReviewSchema>;

export const CreditResponseSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  calculation_id: z.string().uuid().nullable(),
  batch_id: z.string(),
  quantity: z.number(),
  unit: z.string(),
  vintage_year: z.number(),
  status: z.string(),
  issued_by: z.string().uuid().nullable(),
  issued_at: z.string().nullable(),
  issuance_tx_hash: z.string().nullable(),
  retired_at: z.string().nullable(),
  retirement_reason: z.string().nullable(),
  methodology_name: z.string(),
  methodology_version: z.string(),
  serial_number_start: z.number().nullable(),
  serial_number_end: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CreditResponse = z.infer<typeof CreditResponseSchema>;

export const CreditListResponseSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  batch_id: z.string(),
  quantity: z.number(),
  unit: z.string(),
  vintage_year: z.number(),
  status: z.string(),
  issued_at: z.string().datetime().nullable(),
  methodology_name: z.string(),
});

export type CreditListResponse = z.infer<typeof CreditListResponseSchema>;

export const CreditIssuanceSchema = z.object({
  calculation_id: z.string().uuid(),
  batch_id: z.string().min(1).max(100),
  quantity: z.number().positive(),
  vintage_year: z.number().min(2000).max(2100),
  issuance_tx_hash: z.string().max(128).optional(),
  serial_number_start: z.number().optional(),
  serial_number_end: z.number().optional(),
});

export type CreditIssuance = z.infer<typeof CreditIssuanceSchema>;

export const MarketplaceListingResponseSchema = z.object({
  id: z.string().uuid(),
  credit_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  quantity: z.number(),
  price_per_unit: z.number(),
  total_price: z.number(),
  currency: z.string(),
  status: z.string(),
  description: z.string().nullable(),
  listed_at: z.string(),
  sold_at: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  expires_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MarketplaceListingResponse = z.infer<typeof MarketplaceListingResponseSchema>;

export const MarketplaceListingListResponseSchema = z.object({
  id: z.string().uuid(),
  credit_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  quantity: z.number(),
  price_per_unit: z.number(),
  currency: z.string(),
  status: z.string(),
  listed_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable(),
});

export type MarketplaceListingListResponse = z.infer<typeof MarketplaceListingListResponseSchema>;

export const MarketplaceListingCreateSchema = z.object({
  credit_id: z.string().uuid(),
  quantity: z.number().positive(),
  price_per_unit: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  description: z.string().optional(),
  expires_at: z.string().datetime().optional(),
});

export type MarketplaceListingCreate = z.infer<typeof MarketplaceListingCreateSchema>;

export const TransactionResponseSchema = z.object({
  id: z.string().uuid(),
  listing_id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  credit_id: z.string().uuid(),
  quantity: z.number(),
  price_per_unit: z.number(),
  total_amount: z.number(),
  currency: z.string(),
  status: z.string(),
  payment_reference: z.string().nullable(),
  payment_method: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;

export const TransactionCreateSchema = z.object({
  listing_id: z.string().uuid(),
  quantity: z.number().positive(),
  price_per_unit: z.number().positive(),
  total_amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  payment_reference: z.string().max(255).optional(),
  payment_method: z.string().max(50).optional(),
});

export type TransactionCreate = z.infer<typeof TransactionCreateSchema>;

export const VerificationReviewResponseSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  decision: z.string(),
  comments: z.string().nullable(),
  evidence_reviewed: z.boolean().nullable(),
  calculation_reviewed: z.boolean().nullable(),
  methodology_compliant: z.boolean().nullable(),
  reviewed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type VerificationReviewResponse = z.infer<typeof VerificationReviewResponseSchema>;

export const VerificationReviewCreateSchema = z.object({
  project_id: z.string().uuid(),
});

export type VerificationReviewCreate = z.infer<typeof VerificationReviewCreateSchema>;

export const VerificationReviewDecisionSchema = z.object({
  decision: VerificationDecisionSchema,
  comments: z.string().optional(),
  evidence_reviewed: z.boolean().optional(),
  calculation_reviewed: z.boolean().optional(),
  methodology_compliant: z.boolean().optional(),
});

export type VerificationReviewDecision = z.infer<typeof VerificationReviewDecisionSchema>;

export const MonitoringObservationResponseSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  observer_id: z.string().uuid(),
  observation_type: z.string(),
  value: z.number(),
  unit: z.string(),
  source: z.string(),
  quality: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  depth_meters: z.number().nullable(),
  observed_at: z.string(),
  evidence_id: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  metadata_json: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MonitoringObservationResponse = z.infer<typeof MonitoringObservationResponseSchema>;

export const MonitoringObservationCreateSchema = z.object({
  project_id: z.string().uuid(),
  observation_type: z.enum(['biomass', 'carbon_stock', 'tree_height', 'tree_diameter', 'canopy_cover', 'soil_carbon', 'water_level', 'salinity', 'temperature', 'ph', 'biodiversity_index', 'other']),
  value: z.number(),
  unit: z.string().min(1).max(50),
  source: z.enum(['manual', 'sensor', 'satellite', 'drone', 'lab_analysis', 'imported', 'simulated']),
  quality: z.enum(['raw', 'validated', 'flagged', 'rejected']).default('raw'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  depth_meters: z.number().min(0).optional(),
  observed_at: z.string().datetime(),
  evidence_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  metadata_json: z.record(z.unknown()).optional(),
});

export type MonitoringObservationCreate = z.infer<typeof MonitoringObservationCreateSchema>;

export const MonitoringObservationUpdateSchema = z.object({
  observation_type: z.enum(['biomass', 'carbon_stock', 'tree_height', 'tree_diameter', 'canopy_cover', 'soil_carbon', 'water_level', 'salinity', 'temperature', 'ph', 'biodiversity_index', 'other']).optional(),
  value: z.number().optional(),
  unit: z.string().min(1).max(50).optional(),
  source: z.enum(['manual', 'sensor', 'satellite', 'drone', 'lab_analysis', 'imported', 'simulated']).optional(),
  quality: z.enum(['raw', 'validated', 'flagged', 'rejected']).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  depth_meters: z.number().min(0).optional(),
  observed_at: z.string().datetime().optional(),
  evidence_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  metadata_json: z.record(z.unknown()).optional(),
});

export type MonitoringObservationUpdate = z.infer<typeof MonitoringObservationUpdateSchema>;

export const NotificationResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  reference_id: z.string().uuid().nullable(),
  reference_type: z.string().nullable(),
  is_read: z.boolean(),
  read_at: z.string().nullable(),
  created_at: z.string(),
});

export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;

export const NotificationListResponseSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  reference_id: z.string().uuid().nullable(),
  reference_type: z.string().nullable(),
  is_read: z.boolean(),
  created_at: z.string(),
});

export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;

export const NotificationUpdateSchema = z.object({
  is_read: z.boolean().optional(),
});

export type NotificationUpdate = z.infer<typeof NotificationUpdateSchema>;