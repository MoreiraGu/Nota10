import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const variants: Record<string, string> = {
  primary: 'bg-[#E6A700] text-[#2B2200] border-[#C79000] hover:bg-[#D6A000] disabled:opacity-50',
  secondary: 'bg-white text-[#211C10] border-[#D2CFC7] hover:bg-[#FBFAF7] disabled:opacity-50',
  ghost: 'bg-transparent text-[#5B5645] border-transparent hover:bg-[#FFF9E6] disabled:opacity-50 shadow-none',
  destructive: 'bg-white text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-50',
  outline: 'bg-white text-[#8A6D00] border-[#E6A700] hover:bg-[#FFF9E6] disabled:opacity-50',
};

const sizes = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-[15px]',
};

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', ...props }: ButtonProps) {
  const flat = variant === 'ghost';
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center gap-2 font-semibold rounded-[8px] border-[1.5px] transition-all cursor-pointer
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
        ${variants[variant]} ${sizes[size]} ${className}`}
      style={flat ? undefined : { boxShadow: 'var(--shadow-btn)' }}
    >
      {loading && (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
