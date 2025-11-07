"use client";
import React, { useState, useEffect } from 'react';
import CustomDialog from './CustomDialog';

const Notification = ({ type = 'info', title, message, isVisible, onClose, autoClose = true, duration = 4000 }) => {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  return (
    <CustomDialog
      isOpen={isVisible}
      onClose={onClose}
      title={title}
      message={message}
      type={type}
      confirmText="OK"
      showCancel={false}
    />
  );
};

// Hook for managing notifications
const useNotification = () => {
  const [notification, setNotification] = useState(null);

  const showNotification = (type, title, message, options = {}) => {
    setNotification({
      id: Date.now(),
      type,
      title,
      message,
      isVisible: true,
      autoClose: options.autoClose !== false,
      duration: options.duration || 4000,
    });
  };

  const hideNotification = () => {
    setNotification(prev => prev ? { ...prev, isVisible: false } : null);
    setTimeout(() => setNotification(null), 300);
  };

  const success = (title, message, options) => showNotification('success', title, message, options);
  const error = (title, message, options) => showNotification('error', title, message, options);
  const warning = (title, message, options) => showNotification('warning', title, message, options);
  const info = (title, message, options) => showNotification('info', title, message, options);

  return {
    notification,
    showNotification,
    hideNotification,
    success,
    error,
    warning,
    info,
  };
};

export { Notification, useNotification };