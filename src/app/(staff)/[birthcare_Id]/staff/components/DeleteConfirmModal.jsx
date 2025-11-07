"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Button";

/**
 * Modal component for confirming staff deletion
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onConfirm - Function to handle confirmation
 * @param {string} props.staffName - Name of the staff to delete
 */
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, staffName }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Handle confirmation with loading state
  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const result = await onConfirm();
      if (result?.error) {
        setError(result.error);
        setIsDeleting(false);
      }
    } catch (err) {
      setError("Failed to remove staff member. Please try again.");
      setIsDeleting(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              ></path>
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
            Remove Staff Member
          </h3>
          
          <p className="text-center text-gray-600 mb-6">
            Are you sure you want to remove <span className="font-semibold">{staffName}</span> from your staff? 
            This action cannot be undone.
          </p>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Removing...' : 'Remove Staff'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmModal;

