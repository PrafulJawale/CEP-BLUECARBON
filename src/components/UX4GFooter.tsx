import React from 'react';
import { Link } from 'react-router-dom';
import { TreePine, Shield, Globe, Mail, Phone, MapPin } from 'lucide-react';

const UX4GFooter = () => {
  return (
    <footer className="bg-muted border-t border-border">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Organization Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-ocean rounded-lg flex items-center justify-center">
                <TreePine className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg gradient-text">BlueCarbon MRV</h3>
                <p className="text-sm text-muted-foreground">National Carbon Credit Registry</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              An initiative by the Ministry of Environment, Forest and Climate Change, 
              Government of India, designed to monitor, report, and verify blue carbon 
              projects across India's coastal ecosystems.
            </p>
            
            {/* Government Credentials */}
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                <span>Govt. Certified</span>
              </div>
              <div className="flex items-center">
                <Globe className="h-3 w-3 mr-1" />
                <span>Digital India</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/registry" className="text-muted-foreground hover:text-primary transition-colors">Project Registry</Link></li>
              <li><Link to="/marketplace" className="text-muted-foreground hover:text-primary transition-colors">Carbon Marketplace</Link></li>
              <li><Link to="/upload" className="text-muted-foreground hover:text-primary transition-colors">Upload Project</Link></li>
              <li><Link to="/gis" className="text-muted-foreground hover:text-primary transition-colors">GIS Mapping</Link></li>
              <li><Link to="/iot" className="text-muted-foreground hover:text-primary transition-colors">IoT Monitoring</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support & Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p>support@bluecarbon.gov.in</p>
                  <p className="text-xs">General Inquiries</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p>1800-XXX-XXXX</p>
                  <p className="text-xs">Toll Free Helpline</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p>Ministry of Environment</p>
                  <p className="text-xs">New Delhi, India</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Government Footer - UX4G Standard */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm">
              <p>&copy; 2024 Government of India. All rights reserved.</p>
              <div className="flex space-x-4">
                <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
                <Link to="/terms" className="hover:underline">Terms of Service</Link>
                <Link to="/accessibility" className="hover:underline">Accessibility</Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <span>Powered by:</span>
              <div className="flex items-center space-x-2">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/2560px-Flag_of_India.svg.png" 
                  alt="Digital India"
                  className="w-6 h-4"
                />
                <span className="font-medium">Digital India</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Tools - UX4G Feature */}
      <div className="bg-muted/50 border-t border-border">
        <div className="container mx-auto px-6 py-3">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Accessibility Options:</span>
              <button className="hover:text-primary">Screen Reader</button>
              <button className="hover:text-primary">High Contrast</button>
              <button className="hover:text-primary">Large Text</button>
            </div>
            <div className="mt-2 md:mt-0">
              <span>Last Updated: {new Date().toLocaleDateString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default UX4GFooter;