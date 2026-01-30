"use client";

import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  helper?: string;
  error?: string | null;
  children: React.ReactNode;
}

export default function FormField({ label, name, helper, error, children }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className={error ? 'field-error' : ''}>{children}</div>
      {helper && <p className="text-muted text-sm mt-1">{helper}</p>}
      {error && <p className="text-red-700 text-sm mt-1">{error}</p>}
    </div>
  );
}
