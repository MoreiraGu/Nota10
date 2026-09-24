import type { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-[10px] border-[1.5px] border-[#EAD98C]" style={{ boxShadow: 'var(--shadow-card)' }}>
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead style={{ background: '#FFC700' }}>{children}</thead>;
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`px-5 py-3.5 text-left text-xs font-bold text-[#33290A] tracking-wide whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="bg-white [&>tr:nth-child(even)]:bg-[#FFFBEF]">{children}</tbody>;
}

export function Tr({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <tr className={`border-t border-[#F1E9C8] hover:bg-[#FFF3C4] transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`px-5 py-3.5 text-sm text-[#211C10] whitespace-nowrap ${className}`}>{children}</td>;
}

export function SkeletonRow({ cols }: { cols: number }) {
  return (
    <Tr>
      {Array.from({ length: cols }).map((_, i) => (
        <Td key={i}>
          <div className="h-4 bg-[#F1E9C8] rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
        </Td>
      ))}
    </Tr>
  );
}

export function EmptyState({ message, icon }: { message: string; icon?: ReactNode }) {
  return (
    <tr>
      <td colSpan={100}>
        <div className="flex flex-col items-center justify-center py-16 text-[#948F7C]">
          {icon || (
            <svg className="w-10 h-10 mb-3 text-[#D9CE9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
          <p className="text-sm font-medium text-[#5B5645]">{message}</p>
        </div>
      </td>
    </tr>
  );
}
