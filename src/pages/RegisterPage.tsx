import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, type FrontendUserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Waves, Mail, Lock, User, Building } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { gsap } from 'gsap';
import { useTranslation } from '@/contexts/LanguageContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: '' as FrontendUserRole,
    organization: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    // Page animation
    gsap.fromTo('.register-card', 
      { opacity: 0, y: 50, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power2.out' }
    );
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await register(formData);
      if (result.success) {
        toast({
          title: t('register.registrationSuccess'),
          description: t('register.accountCreated'),
        });
        navigate('/dashboard');
      } else {
        toast({
          title: t('register.registrationFailed'),
          description: result.error || "Registration failed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Waves className="h-10 w-10 text-ocean-deep" />
            <h1 className="text-3xl font-bold gradient-text">Blue Carbon Registry MRV</h1>
          </Link>
          <h2 className="text-2xl font-bold text-foreground">{t('register.title')}</h2>
          <p className="text-muted-foreground mt-2">{t('register.subtitle')}</p>
        </div>

        {/* Register Form */}
        <Card className="register-card glass-card">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">{t('register.fullName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    placeholder="Enter your full name"
                    value={formData.full_name}
                    onChange={(e) => updateFormData('full_name', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('register.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('register.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    className="pl-10"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t('register.role')}</Label>
                <Select onValueChange={(value) => updateFormData('role', value as FrontendUserRole)} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('register.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project_developer">Project Developer</SelectItem>
                    <SelectItem value="government_officer">Government Officer</SelectItem>
                    <SelectItem value="buyer">Credit Buyer</SelectItem>
                    <SelectItem value="researcher">Researcher</SelectItem>
                    <SelectItem value="community_representative">Community Representative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">{t('register.organization')}</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="organization"
                    placeholder="Enter organization name (optional)"
                    value={formData.organization}
                    onChange={(e) => updateFormData('organization', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('register.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number (optional)"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button 
                type="submit" 
                variant="ocean" 
                size="lg" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? t('register.loading') : t('register.registerButton')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('register.haveAccount')}{' '}
                <Link to="/login" className="text-ocean-deep hover:text-ocean-medium font-medium">
                  {t('register.signIn')}
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;