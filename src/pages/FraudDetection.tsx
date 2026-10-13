import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, Home } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';

const FraudDetection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="glass px-6 py-4">
        <div className="container mx-auto flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <Home className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Fraud Detection</h1>
            <p className="text-muted-foreground">AI-powered fraud and anomaly detection</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Card className="glass-card p-8 text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Fraud Detection</h3>
          <p className="text-muted-foreground mb-6">
            This feature is under development. AI-powered fraud detection will be available here once implemented.
          </p>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default FraudDetection;