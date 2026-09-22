import type { ReactNode } from 'react';

interface TimelineItemProps {
  icon?: ReactNode;
  title: string;
  meta?: string;
  tone?: 'ok' | 'off' | 'neutral';
  isLast?: boolean;
  children?: ReactNode;
}

export function Timeline({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

const toneStyles: Record<string, { bg: string; border: string; color: string }> = {
  ok: { bg: '#FFC700', border: '#DDA700', color: '#33290A' },
  off: { bg: '#E9E5D6', border: '#D2CFC7', color: '#5B5645' },
  neutral: { bg: '#FFF1C2', border: '#EAD98C', color: '#5B4A00' },
};

export function TimelineItem({ icon, title, meta, tone = 'neutral', isLast, children }: TimelineItemProps) {
  const t = toneStyles[tone];
  return (
    <div className="relative pl-12 pb-6 last:pb-0">
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-[2px]" style={{ background: '#EAD98C' }} />
      )}
      <div
        className="absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center z-10"
        style={{ background: t.bg, border: `1.5px solid ${t.border}`, color: t.color }}
      >
        {icon}
      </div>
      <div className="card-surface-plain p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h4 className="text-sm font-bold text-[#211C10]">{title}</h4>
          {meta && <span className="text-xs font-medium text-[#948F7C] whitespace-nowrap">{meta}</span>}
        </div>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}
