"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useAlert } from '@/hooks/use-alert';
import { Alert } from '@/components/ui/alert';

interface AlertContextType {
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  showAlert: (options: any) => string;
  hideAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlertContext() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlertContext must be used within an AlertProvider');
  }
  return context;
}

interface AlertProviderProps {
  children: ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const alertHook = useAlert();

  return (
    <AlertContext.Provider value={alertHook}>
      {children}
      {/* Render all alerts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {alertHook.alerts.map((alert, index) => (
          <div key={alert.id} style={{ transform: `translateY(${index * 80}px)` }}>
            <Alert
              title={alert.title}
              description={alert.description}
              color={alert.color}
              variant={alert.variant}
              hideIcon={alert.hideIcon}
              isOpen={alert.isVisible}
              onClose={() => alertHook.hideAlert(alert.id)}
              autoClose={false}
              className="mb-2"
            />
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
} 