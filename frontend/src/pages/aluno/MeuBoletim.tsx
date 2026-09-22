import { mockBoletim } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Timeline, TimelineItem } from '../../components/ui/Timeline';

const iconLivro = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

export function MeuBoletim() {
  return (
    <div>
      <PageHeader
        title="Meu Boletim"
        description="Período letivo atual: 2026.2 · Médias calculadas pelo backend"
      />

      <Timeline>
        {mockBoletim.map((item, i, arr) => {
          const tone = item.media === null ? 'neutral' : item.media >= 6 ? 'ok' : 'off';
          return (
            <TimelineItem
              key={i}
              icon={iconLivro}
              title={item.disciplina}
              meta={item.media === null ? 'Aguardando lançamento' : item.media >= 6 ? 'Aprovado' : 'Abaixo da média'}
              tone={tone}
              isLast={i === arr.length - 1}
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {item.notas.map((n, j) => (
                  <span key={j} className="inline-flex items-center gap-1 bg-[#FFF9E6] border border-[#EAD98C] rounded-full px-2.5 py-1 text-xs">
                    <span className="text-[#948F7C]">{n.tipo}:</span>
                    <span className={`font-semibold ${n.valor === null ? 'text-[#B08A00]' : 'text-[#211C10]'}`}>
                      {n.valor === null ? '–' : n.valor.toFixed(1).replace('.', ',')}
                    </span>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-6 text-xs">
                <span className="text-[#5B5645]">
                  Média:{' '}
                  {item.media === null ? (
                    <span className="font-semibold text-[#B08A00]">–</span>
                  ) : (
                    <span className={`font-bold ${item.media >= 6 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {item.media.toFixed(1).replace('.', ',')}
                    </span>
                  )}
                </span>
                <span className="text-[#5B5645]">
                  Frequência:{' '}
                  {item.frequencia === null ? (
                    <span className="font-semibold text-[#B08A00]">–</span>
                  ) : (
                    <span className={`font-bold ${item.frequencia >= 75 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {item.frequencia}%
                    </span>
                  )}
                </span>
              </div>
            </TimelineItem>
          );
        })}
      </Timeline>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-[#948F7C]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#FFC700' }} />
          Aprovado (≥ 6,0)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E9E5D6] inline-block" />
          Abaixo da média
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#FFF1C2', border: '1px solid #EAD98C' }} />
          Aguardando lançamento
        </span>
      </div>
    </div>
  );
}
