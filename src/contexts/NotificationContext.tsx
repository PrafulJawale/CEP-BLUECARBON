import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  getUnreadCount: (userId: string) => number;
  deleteNotification: (notificationId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('bluecarbon_notifications');
    if (!stored) {
      const sampleNotifications: Notification[] = [
        {
          id: '1',
          userId: '1',
          title: 'Project Approved',
          message: 'Your Mangrove Restoration project has been approved!',
          type: 'success',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          link: '/registry'
        },
        {
          id: '2',
          userId: '1',
          title: 'New Credits Available',
          message: '1000 carbon credits are now available for purchase',
          type: 'info',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          read: false,
          link: '/marketplace'
        }
      ];
      localStorage.setItem('bluecarbon_notifications', JSON.stringify(sampleNotifications));
      setNotifications(sampleNotifications);
    } else {
      setNotifications(JSON.parse(stored));
    }
  }, []);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    localStorage.setItem('bluecarbon_notifications', JSON.stringify(updatedNotifications));
  };

  const markAsRead = (notificationId: string) => {
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('bluecarbon_notifications', JSON.stringify(updated));
  };

  const markAllAsRead = (userId: string) => {
    const updated = notifications.map(n => 
      n.userId === userId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('bluecarbon_notifications', JSON.stringify(updated));
  };

  const getUnreadCount = (userId: string) => {
    return notifications.filter(n => n.userId === userId && !n.read).length;
  };

  const deleteNotification = (notificationId: string) => {
    const updated = notifications.filter(n => n.id !== notificationId);
    setNotifications(updated);
    localStorage.setItem('bluecarbon_notifications', JSON.stringify(updated));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        getUnreadCount,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};