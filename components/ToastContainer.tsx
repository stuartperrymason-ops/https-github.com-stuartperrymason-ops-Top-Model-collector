/**
 * @file ToastContainer.tsx
 * @description A container component to display global toast notifications.
 * It sources messages from the DataContext and renders them in a consistent, non-intrusive manner.
 * This program was written by Stuart Mason October 2025.
 */

import React from 'react';
import { useData } from '../context/DataContext';

const ToastContainer: React.FC = () => {
  const { toasts } = useData();

  // If there are no toasts to display, render nothing.
  if (!toasts.length) {
    return null;
  }

  return (
    // The container is positioned fixed to the screen, with ARIA attributes for accessibility.
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {/* Map over the active toasts and render a styled notification for each one. */}
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`max-w-sm w-full bg-surface shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border ${
              toast.type === 'success' ? 'border-green-500' : 'border-red-500'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {/* Display a different icon based on the toast type (success or error). */}
                  {toast.type === 'success' ? (
                    <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-text-primary">
                    {toast.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
