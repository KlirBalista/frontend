"use client";
import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

const CustomDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info', 'confirm'
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
      case 'confirm':
        return <AlertTriangle className="w-16 h-16 text-blue-500" />;
      default:
        return <Info className="w-16 h-16 text-blue-500" />;
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'confirm':
        return 'bg-blue-50';
      default:
        return 'bg-blue-50';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
          onClick={showCancel ? null : onClose}
        ></div>
        
        {/* Dialog */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
          {/* Close button - only show if not confirmation dialog */}
          {!showCancel && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Content */}
          <div className="p-8 text-center">
            {/* Icon */}
            <div className={`mx-auto w-20 h-20 ${getIconBgColor()} rounded-full flex items-center justify-center mb-6`}>
              {getIcon()}
            </div>

            {/* Title */}
            {title && (
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {title}
              </h3>
            )}

            {/* Message */}
            <p className="text-base text-gray-600 leading-relaxed mb-8">
              {message}
            </p>

            {/* Buttons */}
            <div className={`flex gap-3 ${showCancel ? 'justify-center' : 'justify-center'}`}>
              {showCancel && (
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`${showCancel ? 'flex-1' : 'min-w-[140px]'} px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#BF3853] to-[#A41F39] rounded-xl hover:shadow-lg hover:shadow-[#BF3853]/30 transition-all duration-200 hover:scale-105`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDialog;
