import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  fullWidth = true,
  size = 'lg',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    font-semibold rounded-lg transition-colors transform
    focus:outline-none focus:ring-4 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed active:scale-99
  `;

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
  };

  const variantStyles = {
    primary: `btn-primary`,
    secondary: `bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-300`,
    danger: `bg-red-600 hover:bg-red-700 text-white focus:ring-red-300`,
    success: `bg-green-600 hover:bg-green-700 text-white focus:ring-green-300`,
  };

  const widthClass = fullWidth ? 'w-full' : '';
  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
