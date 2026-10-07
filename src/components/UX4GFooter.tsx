import React from 'react';
import { Link } from 'react-router-dom';
import { TreePine, Shield, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';

const UX4GFooter = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-muted border-t border-border mt-auto">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Organization Info */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-ocean rounded-lg flex items-center justify-center flex-shrink-0">
                <TreePine className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base sm:text-lg gradient-text">{t('footer.blueCarbon')}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('footer.nationalRegistry')}</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
            
            {/* Platform Credentials */}
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                <span>{t('footer.certified')}</span>
              </div>
              <div className="flex items-center">
                <Globe className="h-3 w-3 mr-1" />
                <span>{t('footer.technology')}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/registry" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.projectRegistry')}</Link></li>
              <li><Link to="/marketplace" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.carbonMarketplace')}</Link></li>
              <li><Link to="/upload" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.uploadProject')}</Link></li>
              <li><Link to="/gis" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.gisMapping')}</Link></li>
              <li><Link to="/iot" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.iotMonitoring')}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.supportContact')}</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p>support@bluecarbon-registry.example.com</p>
                  <p className="text-xs">{t('footer.generalInquiries')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p>+1-XXX-XXX-XXXX</p>
                  <p className="text-xs">Support Helpline</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p>{t('footer.organization')}</p>
                  <p className="text-xs">{t('footer.location')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Footer */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm">
              <p>{t('footer.copyright')}</p>
              <div className="flex space-x-4">
                <Link to="/privacy" className="hover:underline">{t('footer.privacyPolicy')}</Link>
                <Link to="/terms" className="hover:underline">{t('footer.termsOfService')}</Link>
                <Link to="/accessibility" className="hover:underline">{t('footer.accessibility')}</Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <span>{t('footer.poweredBy')}</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{t('footer.technology')}</span>
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
              <span>{t('footer.accessibilityOptions')}</span>
              <button className="hover:text-primary">{t('footer.screenReader')}</button>
              <button className="hover:text-primary">{t('footer.highContrast')}</button>
              <button className="hover:text-primary">{t('footer.largeText')}</button>
            </div>
            <div className="mt-2 md:mt-0">
              <span>{t('footer.lastUpdated')}: {new Date().toLocaleDateString('en-US')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default UX4GFooter;