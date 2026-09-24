import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[#211C10]">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`w-full px-3.5 py-2.5 text-sm text-[#211C10] bg-white border-[1.5px] rounded-[8px] placeholder:text-[#948F7C] transition-shadow
          ${error ? 'border-red-400' : 'border-[#D2CFC7] hover:border-[#E6A700]'}
          ${className}`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-[#948F7C]">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export function Select({ label, error, children, className = '', id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[#211C10]">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={inputId}
        {...props}
        className={`w-full px-3.5 py-2.5 text-sm text-[#211C10] bg-white border-[1.5px] rounded-[8px] appearance-none transition-shadow cursor-pointer
          ${error ? 'border-red-400' : 'border-[#D2CFC7] hover:border-[#E6A700]'}
          ${className}`}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
