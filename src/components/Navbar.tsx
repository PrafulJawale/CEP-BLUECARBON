import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X, Home, User, LogOut, Settings, Bell, Wallet } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useNotifications } from '@/contexts/NotificationContext';

const UX4GHeader = () => {
  const [fontSize, setFontSize] = useState('medium');
  const [isSkipVisible, setIsSkipVisible] = useState(false);
  const { t } = useTranslation();

  const adjustFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    const root = document.documentElement;
    switch (size) {
      case 'small':
        root.style.fontSize = '14px';
        break;
      case 'medium':
        root.style.fontSize = '16px';
        break;
      case 'large':
        root.style.fontSize = '18px';
        break;
    }
  };

  const skipToContent = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  };

  return (
    <div className="bg-white border-b border-border">
      {/* Skip to Main Content - UX4G Accessibility */}
      <button
        onClick={skipToContent}
        onFocus={() => setIsSkipVisible(true)}
        onBlur={() => setIsSkipVisible(false)}
        className={`${
          isSkipVisible ? 'block' : 'sr-only'
        } absolute top-0 left-0 z-50 bg-primary text-primary-foreground px-4 py-2 text-sm font-medium`}
      >
        {t('navbar.skipToContent')}
      </button>

      {/* Government Header - UX4G Standard */}
      <div className="bg-orange-500 text-white py-1">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/2560px-Flag_of_India.svg.png"              alt={t('navbar.indianFlagAlt')} 
              className="w-6 h-4"
            />
            <span className="font-medium">{t('navbar.governmentOfIndia')}</span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Font Size Controls - UX4G Accessibility */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => adjustFontSize('small')}
                className={`px-2 py-1 text-xs ${fontSize === 'small' ? 'bg-white text-orange-500' : 'hover:bg-orange-600'}`}
              >
                -A
              </button>
              <button
                onClick={() => adjustFontSize('medium')}
                className={`px-2 py-1 text-sm ${fontSize === 'medium' ? 'bg-white text-orange-500' : 'hover:bg-orange-600'}`}
              >
                A
              </button>
              <button
                onClick={() => adjustFontSize('large')}
                className={`px-2 py-1 text-base ${fontSize === 'large' ? 'bg-white text-orange-500' : 'hover:bg-orange-600'}`}
              >
                A+
              </button>
            </div>
            <span className="text-sm">{t('navbar.language')}</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = user ? [
    { name: t('navbar.dashboard'), path: '/dashboard', icon: Home },
    { name: t('navbar.uploadData'), path: '/upload', icon: User },
    { name: t('navbar.registry'), path: '/registry', icon: Settings },
    { name: t('navbar.marketplace'), path: '/marketplace', icon: Wallet },
    { name: t('navbar.gisMapping'), path: '/gis-mapping', icon: Settings },
    { name: t('navbar.iotSensors'), path: '/iot-simulation', icon: Settings },
    { name: t('navbar.carbonWallet'), path: '/wallet', icon: Wallet },
  ] : [
    { name: t('navbar.home'), path: '/', icon: Home },
    { name: t('navbar.registry'), path: '/registry', icon: Settings },
  ];

  // Add admin-specific items
  if (user?.role === 'Admin') {
    navItems.push({ name: t('navbar.adminPanel'), path: '/admin', icon: Settings });
  }

  return (
    <>
      <UX4GHeader />
      
      {/* Main Navigation */}
      <nav className="bg-white shadow-sm border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-ocean rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">BC</span>
              </div>
              <div>
                <h1 className="font-bold text-lg gradient-text">{t('navbar.blueCarbon')}</h1>
                <p className="text-xs text-muted-foreground">{t('navbar.nationalRegistry')}</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  {/* Notifications */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/notifications')}
                    className="relative"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>

                  {/* User Menu */}
                  <div className="flex items-center space-x-3">
                    <div className="hidden md:block text-right">
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.role}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={logout}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}

              {!user && (
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                    {t('navbar.login')}
                  </Button>
                  <Button size="sm" onClick={() => navigate('/register')}>
                    {t('navbar.register')}
                  </Button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;