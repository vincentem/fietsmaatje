"use client";

import React, { useEffect } from 'react';

interface AlertProps {
  type: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
}

export function Alert({ type, title, children, onDismiss }: AlertProps) {
  const colors = {
    error: 'bg-red-50 border-red-300 text-red-900',
    success: 'bg-green-50 border-green-300 text-green-900',
    warning: 'bg-orange-50 border-orange-300 text-orange-900',
    info: 'bg-blue-50 border-blue-300 text-blue-900',
  };

  const icons = {
    error: '❌',
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const role = type === 'error' ? 'alert' : 'status';

  useEffect(() => {
    // auto-focus dismiss button briefly for keyboard users if present
    // no-op here, left for potential enhancements
  }, []);

  return (
    <div
      role={role}
      aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
      className={`${colors[type]} border-l-4 rounded-lg p-4 mb-4 animate-fade-in`}
    >
      <div className="flex items-start">
        <span className="text-2xl mr-3 flex-shrink-0" aria-hidden>
          {icons[type]}
        </span>
        <div className="flex-grow">
          {title && (
            <h4 className="font-bold text-lg mb-1" id={title.replace(/\s+/g, '-').toLowerCase()}>
              {title}
            </h4>
          )}
          <p className="text-lg leading-relaxed">{children}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 font-bold text-xl hover:opacity-70 p-1 rounded"
            aria-label="Dismiss alert"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
