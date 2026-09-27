interface BadgeProps {
  variant: 'ativo' | 'inativo' | 'ativa' | 'encerrada' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

const styles: Record<BadgeProps['variant'], string> = {
  ativo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ativa: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inativo: 'bg-gray-100 text-gray-600 border-gray-200',
  encerrada: 'bg-amber-50 text-amber-700 border-amber-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border-[1.5px] ${styles[variant]}`}>
      {children}
    </span>
  );
}
