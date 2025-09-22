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

      {/* Platform Header */}
      <div className="bg-primary text-primary-foreground py-2 sm:py-1">
        <div className="container mx-auto px-2 sm:px-4">
          {/* Mobile Layout - Stacked */}
          <div className="flex flex-col space-y-2 sm:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-xs truncate">{t('navbar.organization')}</span>
              </div>
              <LanguageSwitcher />
            </div>
            {/* Font Size Controls - Mobile */}
            <div className="flex items-center justify-between">
              <span className="text-xs">{t('navbar.language')}</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => adjustFontSize('small')}
                  className={`px-2 py-1 text-xs rounded ${fontSize === 'small' ? 'bg-white text-orange-500' : 'hover:bg-orange-600'}`}
                >
                  -A
                </button>
                <button
                  onClick={() => adjustFontSize('medium')}
                  className={`px-2 py-1 text-xs rounded ${fontSize === 'medium' ? 'bg-white text-orange-500' : 'hover:bg-orange-600'}`}
                >
                  A
                </button>
                <button
                  onClick={() => adjustFontSize('large')}
                  className={`px-2 py-1 text-xs rounded ${fontSize === 'large' ? 'bg-white text-orange-500' : 'hover:bg-orange-600'}`}
                >
                  A+
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Side by Side */}
          <div className="hidden sm:flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{t('navbar.organization')}</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Font Size Controls - Desktop */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => adjustFontSize('small')}
                  className={`px-2 py-1 text-xs rounded ${fontSize === 'small' ? 'bg-white text-orange-500' : 'hover:bg-orange-600'}`}
                >
                  -A
                </button>
                <button
                  onClick={() => adjustFontSize('medium')}
                  className={`px-2 py-1 text-sm rounded ${fontSize === 'medium' ? 'bg-white text-orange-500' : 'hover:bg-orange-600'}`}
                >
                  A
                </button>
                <button
                  onClick={() => adjustFontSize('large')}
                  className={`px-2 py-1 text-base rounded ${fontSize === 'large' ? 'bg-white text-orange-500' : 'hover:bg-orange-600'}`}
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
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo - Mobile Optimized */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink">
              <img
                src="/c6.png"
                alt={t('navbar.logoAlt') || 'Blue Carbon Logo'}
                className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="font-bold text-sm sm:text-lg gradient-text truncate">{t('navbar.blueCarbon')}</h1>
                <p className="text-xs text-muted-foreground truncate hidden sm:block">{t('navbar.nationalRegistry')}</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 xl:space-x-2 px-2 xl:px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                    location.pathname === item.path
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="h-3 w-3 xl:h-4 xl:w-4 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              ))}
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
              {user && (
                <>
                  {/* Notifications */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/notifications')}
                    className="relative p-2"
                  >
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>

                  {/* User Menu */}
                  <div className="flex items-center space-x-1 sm:space-x-3">
                    <div className="hidden lg:block text-right min-w-0">
                      <p className="text-xs lg:text-sm font-medium truncate max-w-24">{user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={logout} className="p-2">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}

              {!user && (
                <div className="flex space-x-1 sm:space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="text-xs sm:text-sm px-2 sm:px-3">
                    {t('navbar.login')}
                  </Button>
                  <Button size="sm" onClick={() => navigate('/register')} className="text-xs sm:text-sm px-2 sm:px-3">
                    {t('navbar.register')}
                  </Button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 border-t border-border bg-background">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 mx-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                ))}
                
                {/* Mobile User Info */}
                {user && (
                  <div className="px-3 py-3 mx-2 border-t border-border mt-4 pt-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;