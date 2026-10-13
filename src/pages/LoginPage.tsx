import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Waves, Mail, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { gsap } from 'gsap';
import { useTranslation } from '@/contexts/LanguageContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    // Page animation
    gsap.fromTo('.login-card', 
      { opacity: 0, y: 50, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power2.out' }
    );

    gsap.fromTo('.wave-bg', 
      { opacity: 0, scale: 0.8 },
      { opacity: 0.1, scale: 1, duration: 1.5, ease: 'power2.out', stagger: 0.3 }
    );
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast({
          title: t('login.welcomeBack'),
          description: t('login.loginSuccess'),
        });
        navigate('/dashboard');
      } else {
        toast({
          title: t('login.loginFailed'),
          description: result.error || t('login.invalidCredentials'),
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

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="wave-bg absolute top-20 left-10 w-40 h-40 rounded-full bg-gradient-ocean opacity-10"></div>
        <div className="wave-bg absolute bottom-20 right-10 w-32 h-32 rounded-full bg-gradient-sea opacity-10"></div>
        <div className="wave-bg absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-gradient-coral opacity-10"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Waves className="h-10 w-10 text-ocean-deep" />
            <h1 className="text-3xl font-bold gradient-text">Blue Carbon Registry MRV</h1>
          </Link>
          <h2 className="text-2xl font-bold text-foreground">{t('login.welcomeBack')}</h2>
          <p className="text-muted-foreground mt-2">{t('login.subtitle')}</p>
        </div>

        {/* Login Form */}
        <Card className="login-card glass-card">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t('login.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t('login.password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                variant="ocean" 
                size="lg" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? t('login.loading') : t('login.loginButton')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('login.noAccount')}{' '}
                <Link to="/register" className="text-ocean-deep hover:text-ocean-medium font-medium">
                  {t('login.signUp')}
                </Link>
              </p>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-ocean-surface/20 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Demo Credentials:</p>
              <div className="text-xs space-y-1">
                <div>Admin: admin@example.com / admin123</div>
                <div>NGO: ngo@example.com / ngo123</div>
                <div>Panchayat: panchayat@example.com / panchayat123</div>
                <div>Researcher: researcher@example.com / researcher123</div>
                <div>Buyer: buyer@example.com / buyer123</div>
                <div>Gov Officer: govadmin@example.com / govadmin123</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;