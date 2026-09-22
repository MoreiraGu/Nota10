import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-0 border-b border-[#D2CFC7] mb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-2
            ${active === tab.id
              ? 'border-[#E6A700] text-[#8A6D00]'
              : 'border-transparent text-[#5B5645] hover:text-[#211C10]'
            }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${active === tab.id ? 'bg-[#FFF7DD] text-[#8A6D00]' : 'bg-[#F3F4F6] text-[#5B5645]'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ active, id, children }: { active: string; id: string; children: ReactNode }) {
  if (active !== id) return null;
  return <>{children}</>;
}
