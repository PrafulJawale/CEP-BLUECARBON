import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Upload, MapPin, Camera, Satellite, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { gsap } from 'gsap';
import { useTranslation } from '@/contexts/LanguageContext';

const DataUpload = () => {
  const { user } = useAuth();
  const { createProject } = useData();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
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
    }
  };

  const simulateUpload = () => {
    return new Promise<void>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        setUploadProgress(progress);
      }, 200);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file upload
      await simulateUpload();

      // Create project with dummy file names
      const allImages = [
        ...formData.droneImages.map(f => f.name),
        ...formData.satelliteImages.map(f => f.name)
      ];
      const allDataFiles = formData.iotData.map(f => f.name);

      createProject({
        name: formData.name,
        description: formData.description,
        userId: user.id,
        gpsCoordinates: {
          lat: parseFloat(formData.latitude),
          lng: parseFloat(formData.longitude)
        },
        images: allImages,
        dataFiles: allDataFiles,
        treeCount: 0, // Will be calculated by createProject
        biomass: 0, // Will be calculated by createProject
        co2Sequestered: 0, // Will be calculated by createProject
      });

      toast({
        title: t('upload.projectUploaded'),
        description: t('upload.projectSubmitted'),
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: t('upload.uploadFailed'),
        description: t('upload.uploadError'),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
                  <Label htmlFor="latitude">{t('upload.latitude')}</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
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
                    placeholder={t('upload.longitudePlaceholder')}
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
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
                  />
                  {formData.droneImages.length > 0 && (
                    <p className="text-xs text-sea-green mt-2">
                      {formData.droneImages.length} files selected
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
                  />
                  {formData.satelliteImages.length > 0 && (
                    <p className="text-xs text-sea-green mt-2">
                      {formData.satelliteImages.length} files selected
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
                    accept=".csv,.xlsx,.json"
                    onChange={(e) => handleFileChange('iotData', e.target.files)}
                    className="text-xs"
                  />
                  {formData.iotData.length > 0 && (
                    <p className="text-xs text-sea-green mt-2">
                      {formData.iotData.length} files selected
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <Card className="upload-card glass-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t('upload.uploading')}</span>
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