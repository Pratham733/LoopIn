"use client";

import { Alert as HeroAlert } from "@heroui/react";
import { useState, useEffect } from "react";

interface AlertProps {
  title?: string;
  description?: string;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  variant?: "solid" | "bordered" | "flat" | "faded";
  hideIcon?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  className?: string;
}

export function Alert({
  title,
  description,
  color = "default",
  variant = "faded",
  hideIcon = false,
  isOpen = true,
  onClose,
  autoClose = false,
  duration = 5000,
  className = "",
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm p-4 ${className}`}>
      <HeroAlert
        hideIcon={hideIcon}
        color={color}
        description={description}
        title={title}
        variant={variant}
        onClose={() => {
          setIsVisible(false);
          onClose?.();
        }}
        isClosable={!!onClose}
        classNames={{
          alertIcon: 'mr-4',
          closeButton: 'ml-2',
        }}
      />
    </div>
  );
}

// Toast-like Alert component for notifications
export function AlertToast({
  title,
  description,
  color = "success",
  variant = "faded",
  hideIcon = false,
  duration = 5000,
  onClose,
}: Omit<AlertProps, 'isOpen' | 'autoClose'>) {
  return (
    <Alert
      title={title}
      description={description}
      color={color}
      variant={variant}
      hideIcon={hideIcon}
      autoClose={true}
      duration={duration}
      onClose={onClose}
    />
  );
}
