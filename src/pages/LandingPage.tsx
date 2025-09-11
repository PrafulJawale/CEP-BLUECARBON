import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TreePine, Leaf, Shield, BarChart3, Users, Globe, ArrowRight, CheckCircle } from 'lucide-react';
import { gsap } from 'gsap';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Hero animations
    gsap.fromTo('.hero-title', 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
    );

    gsap.fromTo('.hero-subtitle', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'power2.out' }
    );

    gsap.fromTo('.hero-buttons', 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.6, ease: 'power2.out' }
    );

    // Wave animation
    gsap.to('.wave', {
      y: -10,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
      stagger: 0.2
    });

    // Feature cards animation
    gsap.fromTo('.feature-card', 
      { opacity: 0, y: 50, scale: 0.9 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 0.8, 
        delay: 1,
        ease: 'power2.out',
        stagger: 0.1
      }
    );
  }, []);

  return (
    <div className="min-h-screen" id="main-content">
      {/* Digital India Initiative Banner - UX4G Standard */}
      <div className="bg-primary text-primary-foreground py-3">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-medium">
            🇮🇳 A Digital India Initiative | Ministry of Environment, Forest and Climate Change
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Waves */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="wave absolute w-96 h-96 bg-gradient-ocean rounded-full opacity-20 -top-48 -left-48"></div>
          <div className="wave absolute w-72 h-72 bg-gradient-sea rounded-full opacity-30 top-32 right-0"></div>
          <div className="wave absolute w-80 h-80 bg-gradient-coral rounded-full opacity-25 bottom-0 left-1/4"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-sea-green/10 text-sea-green rounded-full text-sm font-medium mb-6">
              <CheckCircle className="h-4 w-4 mr-2" />
              Government of India Certified
            </div>
          </div>
          
          <h1 className="hero-title text-4xl md:text-6xl font-bold gradient-text mb-6">
            BlueCarbon MRV Platform
          </h1>
          <h2 className="hero-subtitle text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            National Carbon Credit Registry (NCCR) for Blue Carbon Projects - 
            Mangroves, Seagrass & Coastal Ecosystem Restoration
          </h2>
          
          {/* Key Benefits - UX4G Pattern */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center text-sm text-muted-foreground">
              <Shield className="h-4 w-4 mr-2 text-sea-green" />
              Government Verified
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Globe className="h-4 w-4 mr-2 text-ocean-medium" />
              Blockchain Secured
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4 mr-2 text-coral" />
              Real-time Monitoring
            </div>
          </div>

          <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="px-8 py-4 text-lg group"
              onClick={() => navigate('/register')}
            >
              Register Your Project
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg"
              onClick={() => navigate('/registry')}
            >
              Explore Registry
            </Button>
          </div>

          {/* Quick Stats - Government Format */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">1,200+</div>
              <div className="text-sm text-muted-foreground">Projects Registered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-sea-green">2.5M</div>
              <div className="text-sm text-muted-foreground">Tonnes CO₂ Captured</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-coral">850+</div>
              <div className="text-sm text-muted-foreground">NGOs Participating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-ocean-medium">15</div>
              <div className="text-sm text-muted-foreground">States Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - UX4G Layout */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">Platform Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete ecosystem for blue carbon project management and verification
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="feature-card glass-card hover:scale-105 transition-transform duration-300">
              <div className="p-6">
                <div className="w-12 h-12 bg-gradient-ocean rounded-lg flex items-center justify-center mb-4">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI-Powered Monitoring</h3>
                <p className="text-muted-foreground">
                  Advanced AI algorithms analyze drone imagery, satellite data, and IoT sensors 
                  to accurately measure carbon sequestration.
                </p>
              </div>
            </Card>

            <Card className="feature-card glass-card hover:scale-105 transition-transform duration-300">
              <div className="p-6">
                <div className="w-12 h-12 bg-gradient-sea rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Blockchain Registry</h3>
                <p className="text-muted-foreground">
                  Immutable blockchain-based registry ensures transparency and prevents 
                  double counting of carbon credits.
                </p>
              </div>
            </Card>

            <Card className="feature-card glass-card hover:scale-105 transition-transform duration-300">
              <div className="p-6">
                <div className="w-12 h-12 bg-gradient-coral rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Carbon Marketplace</h3>
                <p className="text-muted-foreground">
                  Direct marketplace connecting project developers with buyers, 
                  ensuring fair pricing and transparent transactions.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Government Services Section - UX4G Pattern */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">Government Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Accessible digital services for all stakeholders
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="feature-card glass-card text-center p-8">
              <div className="w-16 h-16 bg-gradient-ocean rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">For NGOs & Communities</h3>
              <p className="text-muted-foreground mb-4">
                Register projects, upload monitoring data, earn carbon credits
              </p>
              <Button variant="outline" onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </Card>

            <Card className="feature-card glass-card text-center p-8">
              <div className="w-16 h-16 bg-gradient-sea rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">For Government Officials</h3>
              <p className="text-muted-foreground mb-4">
                Verify projects, monitor compliance, generate reports
              </p>
              <Button variant="outline" onClick={() => navigate('/admin')}>
                Admin Portal
              </Button>
            </Card>

            <Card className="feature-card glass-card text-center p-8">
              <div className="w-16 h-16 bg-gradient-coral rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">For Carbon Buyers</h3>
              <p className="text-muted-foreground mb-4">
                Purchase verified credits, track impact, ensure authenticity
              </p>
              <Button variant="outline" onClick={() => navigate('/marketplace')}>
                Buy Credits
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;