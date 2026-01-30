"use client";

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
}

export function Card({ children, className = '', onClick, selectable = false, selected = false }: CardProps) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (!selectable || !onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKey}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      aria-pressed={selectable ? (selected ? 'true' : 'false') : undefined}
      className={`
        bg-white rounded-xl border-2 p-6 transition-all transform
        ${selectable ? 'cursor-pointer focus:ring-4 focus:ring-blue-200' : ''}
        ${selected ? 'border-blue-600 shadow-xl scale-[1.01]' : 'border-gray-200 hover:shadow-md'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return <h3 className={`text-2xl font-bold text-gray-900 mb-2 ${className}`}>{children}</h3>;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return <div className={`text-lg text-gray-600 leading-relaxed ${className}`}>{children}</div>;
}
