import { useState, useCallback } from 'react';

interface AlertOptions {
  title?: string;
  description?: string;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  variant?: "solid" | "bordered" | "flat" | "faded";
  hideIcon?: boolean;
  duration?: number;
}

interface AlertState extends AlertOptions {
  id: string;
  isVisible: boolean;
}

export function useAlert() {
  const [alerts, setAlerts] = useState<AlertState[]>([]);

  const showAlert = useCallback((options: AlertOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAlert: AlertState = {
      ...options,
      id,
      isVisible: true,
    };

    setAlerts(prev => [...prev, newAlert]);

    // Auto-remove after duration
    if (options.duration !== 0) {
      setTimeout(() => {
        hideAlert(id);
      }, options.duration || 5000);
    }

    return id;
  }, []);

  const hideAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const success = useCallback((title: string, description?: string) => {
    return showAlert({
      title,
      description,
      color: "success",
      variant: "faded",
    });
  }, [showAlert]);

  const error = useCallback((title: string, description?: string) => {
    return showAlert({
      title,
      description,
      color: "danger",
      variant: "faded",
    });
  }, [showAlert]);

  const warning = useCallback((title: string, description?: string) => {
    return showAlert({
      title,
      description,
      color: "warning",
      variant: "faded",
    });
  }, [showAlert]);

  const info = useCallback((title: string, description?: string) => {
    return showAlert({
      title,
      description,
      color: "primary",
      variant: "faded",
    });
  }, [showAlert]);

  return {
    alerts,
    showAlert,
    hideAlert,
    success,
    error,
    warning,
    info,
  };
} 