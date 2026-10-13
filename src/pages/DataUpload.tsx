import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Upload, MapPin, Camera, Satellite, Database, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { gsap } from 'gsap';
import { useTranslation } from '@/contexts/LanguageContext';
import { api, EvidenceTypeSchema, ProjectResponseSchema, type EvidenceUploadResponse, ApiError } from '@/lib/api';

const DataUpload = () => {
  const { user } = useAuth();
  const { refreshProjects } = useData();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ecosystemType: 'mangrove',
    country: 'India',
    stateProvince: '',
    district: '',
    latitude: '',
    longitude: '',
    areaHectares: '100',
    droneImages: [] as File[],
    satelliteImages: [] as File[],
    iotData: [] as File[],
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Page animations
    gsap.fromTo('.upload-card', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1 }
    );
  }, [user, navigate]);

  const handleFileChange = (type: 'droneImages' | 'satelliteImages' | 'iotData', files: FileList | null) => {
    if (files) {
      setFormData(prev => ({
        ...prev,
        [type]: Array.from(files)
      }));
      setError(null);
    }
  };

  const mapFileTypeToEvidenceType = (type: 'droneImages' | 'satelliteImages' | 'iotData'): string => {
    switch (type) {
      case 'droneImages':
        return 'drone_image';
      case 'satelliteImages':
        return 'satellite_image';
      case 'iotData':
        return 'iot_data';
      default:
        return 'other';
    }
  };

  const uploadEvidenceFiles = async (projectId: string): Promise<EvidenceUploadResponse[]> => {
    const allFiles: Array<{ file: File; evidenceType: string }> = [
      ...formData.droneImages.map(f => ({ file: f, evidenceType: 'drone_image' })),
      ...formData.satelliteImages.map(f => ({ file: f, evidenceType: 'satellite_image' })),
      ...formData.iotData.map(f => ({ file: f, evidenceType: 'iot_data' })),
    ];

    const results: EvidenceUploadResponse[] = [];
    const totalFiles = allFiles.length;

    for (let i = 0; i < totalFiles; i++) {
      const { file, evidenceType } = allFiles[i];
      const progress = ((i) / totalFiles) * 100;
      setUploadProgress(progress);
      setUploadStage(`Uploading ${file.name} (${i + 1}/${totalFiles})`);

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      // Backend expects project_id and evidence_type as query parameters
      const endpoint = `/evidence/upload?project_id=${projectId}&evidence_type=${evidenceType}`;

      try {
        const response = await api.upload<EvidenceUploadResponse>(
          endpoint,
          formDataUpload
        );
        results.push(response);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : `Failed to upload ${file.name}`;
        throw new Error(message);
      }
    }

    setUploadProgress(100);
    setUploadStage('All files uploaded successfully');
    return results;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStage('Creating project...');
    setError(null);

    try {
      // Step 1: Create project via API directly to get project ID
      const payload = {
        name: formData.name,
        description: formData.description,
        ecosystem_type: formData.ecosystemType,
        country: formData.country,
        state_province: formData.stateProvince || undefined,
        district: formData.district || undefined,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        area_hectares: parseFloat(formData.areaHectares),
      };

      setUploadStage('Creating project...');
      const projectResponse = await api.post('/projects', payload, ProjectResponseSchema);
      const projectId = projectResponse.id;
      setUploadStage('Project created, uploading evidence...');

      // Step 3: Upload evidence files
      const totalFiles = formData.droneImages.length + formData.satelliteImages.length + formData.iotData.length;
      if (totalFiles > 0) {
        await uploadEvidenceFiles(projectId);
      } else {
        setUploadStage('No evidence files to upload');
      }

      // Refresh projects list
      await refreshProjects();

      toast({
        title: t('upload.projectUploaded'),
        description: totalFiles > 0 
          ? `${totalFiles} file(s) uploaded successfully` 
          : t('upload.projectSubmitted'),
      });

      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      toast({
        title: t('upload.uploadFailed'),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="glass px-6 py-4">
        <div className="container mt-20 mx-auto">
          <h1 className="text-2xl font-bold gradient-text">{t('upload.dataUpload')}</h1>
          <p className="text-muted-foreground">{t('upload.uploadDescription')}</p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Project Info */}
          <Card className="upload-card glass-card">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-ocean-deep" />
                {t('upload.projectInformation')}
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('upload.projectName')}</Label>
                  <Input
                    id="name"
                    placeholder={t('upload.projectNamePlaceholder')}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('upload.projectDescription')}</Label>
                  <Textarea
                    id="description"
                    placeholder={t('upload.descriptionPlaceholder')}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ecosystemType">{t('upload.ecosystemType')}</Label>
                  <select
                    id="ecosystemType"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ocean-deep"
                    value={formData.ecosystemType}
                    onChange={(e) => setFormData(prev => ({ ...prev, ecosystemType: e.target.value }))}
                    required
                  >
                    <option value="mangrove">{t('upload.ecosystemMangrove')}</option>
                    <option value="seagrass">{t('upload.ecosystemSeagrass')}</option>
                    <option value="salt_marsh">{t('upload.ecosystemSaltMarsh')}</option>
                    <option value="coastal_wetland">{t('upload.ecosystemCoastalWetland')}</option>
                    <option value="other">{t('upload.ecosystemOther')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">{t('upload.country')}</Label>
                  <Input
                    id="country"
                    placeholder={t('upload.countryPlaceholder')}
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stateProvince">{t('upload.stateProvince')}</Label>
                  <Input
                    id="stateProvince"
                    placeholder={t('upload.stateProvincePlaceholder')}
                    value={formData.stateProvince}
                    onChange={(e) => setFormData(prev => ({ ...prev, stateProvince: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">{t('upload.district')}</Label>
                  <Input
                    id="district"
                    placeholder={t('upload.districtPlaceholder')}
                    value={formData.district}
                    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="latitude">{t('upload.latitude')}</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    placeholder={t('upload.latitudePlaceholder')}
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">{t('upload.longitude')}</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    placeholder={t('upload.longitudePlaceholder')}
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaHectares">{t('upload.areaHectares')}</Label>
                  <Input
                    id="areaHectares"
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder={t('upload.areaHectaresPlaceholder')}
                    value={formData.areaHectares}
                    onChange={(e) => setFormData(prev => ({ ...prev, areaHectares: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* File Uploads */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Drone Images */}
            <Card className="upload-card glass-card">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-ocean-deep" />
                  {t('upload.droneImages')}
                </h3>
                <div className="border-2 border-dashed border-ocean-light rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">{t('upload.uploadDroneImages')}</p>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileChange('droneImages', e.target.files)}
                    className="text-xs"
                    disabled={isUploading}
                  />
                  {formData.droneImages.length > 0 && (
                    <p className="text-xs text-sea-green mt-2">
                      {formData.droneImages.length} file(s) selected
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Satellite Images */}
            <Card className="upload-card glass-card">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Satellite className="h-5 w-5 mr-2 text-ocean-deep" />
                  {t('upload.satelliteData')}
                </h3>
                <div className="border-2 border-dashed border-ocean-light rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">{t('upload.uploadSatelliteData')}</p>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileChange('satelliteImages', e.target.files)}
                    className="text-xs"
                    disabled={isUploading}
                  />
                  {formData.satelliteImages.length > 0 && (
                    <p className="text-xs text-sea-green mt-2">
                      {formData.satelliteImages.length} file(s) selected
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* IoT Data */}
            <Card className="upload-card glass-card">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Database className="h-5 w-5 mr-2 text-ocean-deep" />
                  {t('upload.iotData')}
                </h3>
                <div className="border-2 border-dashed border-ocean-light rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">{t('upload.uploadIoTData')}</p>
                  <Input
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.json,.geojson"
                    onChange={(e) => handleFileChange('iotData', e.target.files)}
                    className="text-xs"
                    disabled={isUploading}
                  />
                  {formData.iotData.length > 0 && (
                    <p className="text-xs text-sea-green mt-2">
                      {formData.iotData.length} file(s) selected
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="upload-card glass-card border-red-500/30 bg-red-500/5">
              <div className="p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">{t('upload.errorOccurred')}</p>
                  <p>{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <Card className="upload-card glass-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{uploadStage || t('upload.uploading')}</span>
                  <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            </Card>
          )}

          {/* Submit */}
          <div className="flex justify-center">
            <Button 
              type="submit" 
              variant="ocean" 
              size="xl"
              disabled={isUploading}
              className="min-w-[200px]"
            >
              {isUploading ? t('upload.uploading') : t('upload.submitProject')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataUpload;