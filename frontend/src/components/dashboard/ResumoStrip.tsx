interface ItemResumo {
  label: string;
  value: string | number;
  sub?: string;
}

export function ResumoStrip({ items }: { items: ItemResumo[] }) {
  return (
    <div className="card-surface p-6 flex flex-wrap mb-8">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`flex-1 min-w-[140px] px-6 first:pl-0 last:pr-0 ${i > 0 ? 'border-l-[1.5px] border-[#EAD98C]' : ''}`}
        >
          <div className="text-3xl font-bold text-[#211C10] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            {item.value}
          </div>
          <div className="text-sm font-semibold text-[#5B5645]">{item.label}</div>
          {item.sub && <div className="text-xs text-[#948F7C] mt-0.5">{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}

export function Saudacao({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <>
      <h1 className="text-2xl font-bold text-[#211C10] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        {titulo}
      </h1>
      <p className="text-sm text-[#5B5645] mb-6">{subtitulo}</p>
    </>
  );
}
