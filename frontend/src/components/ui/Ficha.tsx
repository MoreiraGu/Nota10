import type { ReactNode } from 'react';

interface FichaStat {
  icon: ReactNode;
  label: string;
}

interface FichaStatus {
  label: string;
  tone: 'ok' | 'off';
}

interface FichaProps {
  eyebrow: string;
  title: string;
  watermark?: ReactNode;
  stats: FichaStat[];
  status?: FichaStatus;
  actions?: ReactNode;
  muted?: boolean;
}

export function Ficha({ eyebrow, title, watermark, stats, status, actions, muted }: FichaProps) {
  return (
    <div
      className="relative rounded-[16px] p-5 flex flex-col overflow-hidden"
      style={{
        background: muted ? '#F4F2EA' : 'var(--color-navbar)',
        border: muted ? '1.5px solid #E3DFCF' : '1.5px solid #DDA700',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {watermark && (
        <div
          className="absolute -right-3 -top-3 w-20 h-20 flex items-center justify-center opacity-[0.16] pointer-events-none"
          style={{ color: muted ? '#948F7C' : '#33290A' }}
        >
          {watermark}
        </div>
      )}

      <div className="relative z-10 flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span
            className="text-[11px] font-bold tracking-wide"
            style={{ color: muted ? '#8A8368' : '#5B4A00' }}
          >
            {eyebrow}
          </span>
          {status && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                background: status.tone === 'ok' ? 'rgba(10,124,82,0.14)' : 'rgba(107,114,128,0.18)',
                color: status.tone === 'ok' ? '#0A5C3E' : '#5B5645',
              }}
            >
              {status.label}
            </span>
          )}
        </div>
        <h3
          className="text-lg font-bold leading-snug mb-4"
          style={{ color: muted ? '#5B5645' : '#211C10', fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h3>
      </div>

      <div className="relative z-10 flex flex-col gap-1.5">
        {stats.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-white/90 rounded-[8px] px-3 py-2 text-xs font-medium text-[#3A3524]"
          >
            <span className="shrink-0" style={{ color: '#8A6D00' }}>{s.icon}</span>
            <span className="truncate">{s.label}</span>
          </div>
        ))}
      </div>

      {actions && (
        <div
          className="relative z-10 mt-3 pt-3 flex items-center gap-4"
          style={{ borderTop: `1px solid ${muted ? '#E3DFCF' : 'rgba(51,41,10,0.15)'}` }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

/* Icones pequenos reutilizados nas fichas */
export const FichaIcons = {
  email: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  curso: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42A12.083 12.083 0 0112 20.055 12.083 12.083 0 015.84 10.58L12 14z" />
    </svg>
  ),
  calendario: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  turma: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />
    </svg>
  ),
  telefone: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
};

/* Icones grandes usados como marca d'agua */
export const FichaWatermarks = {
  pessoa: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-full h-full">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  ),
  formatura: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42A12.083 12.083 0 0112 20.055 12.083 12.083 0 015.84 10.58L12 14z" />
    </svg>
  ),
  turma: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />
    </svg>
  ),
  livro: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
};
