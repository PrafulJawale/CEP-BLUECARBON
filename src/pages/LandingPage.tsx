import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Leaf, Waves, TreePine, Globe, Shield, TrendingUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const wavesRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero animation
    const heroTl = gsap.timeline();
    heroTl
      .fromTo('.hero-title', 
        { opacity: 0, y: 100 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
      )
      .fromTo('.hero-subtitle', 
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
        '-=0.8'
      )
      .fromTo('.hero-buttons', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      );

    // Animated waves
    gsap.to('.wave', {
      y: -20,
      duration: 3,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1,
      stagger: 0.5
    });

    // Features scroll animation
    gsap.fromTo('.feature-card', 
      { opacity: 0, y: 80, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 80%',
        }
      }
    );

    // About section animation
    gsap.fromTo('.about-content', 
      { opacity: 0, x: -100 },
      {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: aboutRef.current,
          start: 'top 80%',
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Navigation */}
      <nav className="glass fixed top-0 w-full z-50 px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Waves className="h-8 w-8 text-ocean-deep" />
            <h1 className="text-2xl font-bold gradient-text">BlueCarbon MRV</h1>
          </div>
          <div className="flex space-x-4">
            <Link to="/login">
              <Button variant="glass" size="sm">Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="ocean" size="sm">Register</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Waves */}
        <div ref={wavesRef} className="absolute inset-0 opacity-10">
          <div className="wave absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-ocean"></div>
          <div className="wave absolute top-40 right-20 w-24 h-24 rounded-full bg-gradient-sea"></div>
          <div className="wave absolute bottom-32 left-1/4 w-40 h-40 rounded-full bg-gradient-coral"></div>
          <div className="wave absolute bottom-20 right-1/3 w-28 h-28 rounded-full bg-gradient-ocean"></div>
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="hero-title text-6xl md:text-8xl font-bold mb-6">
            <span className="gradient-text">BlueCarbon</span>
            <br />
            <span className="gradient-sea-text">MRV Platform</span>
          </h1>
          
          <p className="hero-subtitle text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Revolutionizing carbon credit verification through AI-powered monitoring, 
            blockchain registry, and transparent marketplace for blue carbon ecosystems.
          </p>

          <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                <TreePine className="mr-2" />
                Register Project
              </Button>
            </Link>
            <Link to="/registry">
              <Button variant="glass" size="xl" className="w-full sm:w-auto">
                <Globe className="mr-2" />
                Explore Registry
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 px-6">
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
                  <TrendingUp className="h-6 w-6 text-white" />
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

      {/* About Section */}
      <section ref={aboutRef} className="py-20 px-6 bg-gradient-to-r from-ocean-surface/20 to-sea-green-light/20">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="about-content">
              <h2 className="text-4xl font-bold gradient-text mb-6">
                The Future of Blue Carbon
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Blue carbon ecosystems like mangroves, seagrass beds, and salt marshes are among 
                the most effective carbon sinks on Earth. Our platform provides the tools needed 
                to accurately measure, verify, and trade carbon credits from these critical ecosystems.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gradient-ocean rounded-full mr-3"></div>
                  <span>Real-time monitoring and verification</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gradient-sea rounded-full mr-3"></div>
                  <span>Community-driven conservation</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gradient-coral rounded-full mr-3"></div>
                  <span>Transparent marketplace transactions</span>
                </div>
              </div>
            </div>
            <div className="float">
              <Card className="glass-card p-8 text-center">
                <div className="text-6xl font-bold gradient-text mb-2">50M+</div>
                <div className="text-lg text-muted-foreground mb-4">Tons CO₂ Tracked</div>
                <div className="text-4xl font-bold gradient-sea-text mb-2">1,200+</div>
                <div className="text-lg text-muted-foreground mb-4">Projects Verified</div>
                <div className="text-4xl font-bold gradient-text mb-2">₹25Cr+</div>
                <div className="text-lg text-muted-foreground">Credits Traded</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass py-12 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Waves className="h-8 w-8 text-ocean-deep" />
            <h3 className="text-2xl font-bold gradient-text">BlueCarbon MRV</h3>
          </div>
          <p className="text-muted-foreground mb-6">
            Powered by National Centre for Coastal Research (NCCR)
          </p>
          <div className="flex justify-center space-x-6">
            <Link to="/registry" className="text-ocean-deep hover:text-ocean-medium transition-colors">
              Registry
            </Link>
            <Link to="/marketplace" className="text-ocean-deep hover:text-ocean-medium transition-colors">
              Marketplace
            </Link>
            <Link to="/login" className="text-ocean-deep hover:text-ocean-medium transition-colors">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;