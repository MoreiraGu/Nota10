import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  backTo?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, action, backTo, breadcrumbs }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div
      className="-mx-6 lg:-mx-8 -mt-6 lg:-mt-8 mb-7 px-6 lg:px-8 pt-5 pb-6"
      style={{ background: 'var(--color-tint)', borderBottom: '1.5px solid var(--color-tint-border)' }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center flex-wrap gap-1.5 text-xs mb-4">
          <span className="inline-flex items-center gap-1 bg-white/70 rounded-full px-3 py-1 font-medium text-[#5B5645]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Início
          </span>
          {breadcrumbs.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <svg className="w-3 h-3 text-[#948F7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {b.href ? (
                <button
                  onClick={() => navigate(b.href!)}
                  className="bg-white/70 hover:bg-white rounded-full px-3 py-1 font-medium text-[#5B5645] hover:text-[#8A6D00] transition-colors cursor-pointer"
                >
                  {b.label}
                </button>
              ) : (
                <span className="bg-[#33290A] rounded-full px-3 py-1 font-semibold text-white">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          className="flex items-center gap-1.5 text-xs font-medium text-[#5B5645] hover:text-[#8A6D00] mb-3 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
      )}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] leading-tight font-bold text-[#211C10]" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
          {description && <p className="mt-1.5 text-sm text-[#5B5645]">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
