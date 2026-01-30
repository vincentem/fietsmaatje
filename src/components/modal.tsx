"use client";

import React, { useEffect, useRef } from 'react';

interface ModalProps {
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  open: boolean;
}

export default function Modal({ title, children, onClose, open }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        // Simple focus trap
        const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    const prev = document.activeElement as HTMLElement | null;
    // focus first focusable inside modal
    setTimeout(() => {
      const first = contentRef.current?.querySelector<HTMLElement>('button, [tabindex], input, select, textarea, a');
      first?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={contentRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 animate-fade-in"
      >
        {title && (
          <h3 id="modal-title" className="text-xl font-semibold mb-4">
            {title}
          </h3>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}
