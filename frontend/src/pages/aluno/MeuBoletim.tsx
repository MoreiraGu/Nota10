import { useEffect, useState } from 'react';

import type { ItemBoletim } from '../../types';
import { api } from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Timeline, TimelineItem } from '../../components/ui/Timeline';

const iconLivro = (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

export function MeuBoletim() {
  const [boletim, setBoletim] = useState<ItemBoletim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarBoletim() {
      setLoading(true);
      setError(null);

      try {
        const data = await api.getMeuBoletim();
        setBoletim(data);
      } catch (err: any) {
        setError(
          err?.message ||
            'Não foi possível carregar o boletim.'
        );
      } finally {
        setLoading(false);
      }
    }

    carregarBoletim();
  }, []);

  return (
    <div>
      <PageHeader
        title="Meu Boletim"
        description="Consulte suas notas, médias e frequência nas turmas em que está matriculado."
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm font-semibold">
            Carregando boletim...
          </p>
        </div>
      ) : boletim.length === 0 ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm">
            Nenhuma turma matriculada encontrada.
          </p>
        </div>
      ) : (
        <>
          <Timeline>
            {boletim.map((item, index) => {
              const tone =
                item.media === null
                  ? 'neutral'
                  : item.media >= 6
                    ? 'ok'
                    : 'off';

              const situacaoMedia =
                item.media === null
                  ? 'Aguardando lançamento'
                  : item.media >= 6
                    ? 'Média igual ou acima de 6,0'
                    : 'Média abaixo de 6,0';

              return (
                <TimelineItem
                  key={item.turmaId}
                  icon={iconLivro}
                  title={item.disciplina}
                  meta={situacaoMedia}
                  tone={tone}
                  isLast={index === boletim.length - 1}
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.notas.map((nota, notaIndex) => (
                      <span
                        key={`${item.turmaId}-${notaIndex}`}
                        className="inline-flex items-center gap-1 bg-[#FFF9E6] border border-[#EAD98C] rounded-full px-2.5 py-1 text-xs"
                      >
                        <span className="text-[#948F7C]">
                          {nota.tipo}:
                        </span>

                        <span
                          className={`font-semibold ${
                            nota.valor === null
                              ? 'text-[#B08A00]'
                              : 'text-[#211C10]'
                          }`}
                        >
                          {nota.valor === null
                            ? '–'
                            : nota.valor
                                .toFixed(1)
                                .replace('.', ',')}
                        </span>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-6 text-xs">
                    <span className="text-[#5B5645]">
                      Média:{' '}
                      {item.media === null ? (
                        <span className="font-semibold text-[#B08A00]">
                          –
                        </span>
                      ) : (
                        <span
                          className={`font-bold ${
                            item.media >= 6
                              ? 'text-emerald-700'
                              : 'text-red-700'
                          }`}
                        >
                          {item.media
                            .toFixed(1)
                            .replace('.', ',')}
                        </span>
                      )}
                    </span>

                    <span className="text-[#5B5645]">
                      Frequência:{' '}
                      {item.frequencia === null ? (
                        <span className="font-semibold text-[#B08A00]">
                          –
                        </span>
                      ) : (
                        <span
                          className={`font-bold ${
                            item.frequencia >= 75
                              ? 'text-emerald-700'
                              : 'text-red-700'
                          }`}
                        >
                          {item.frequencia
                            .toFixed(1)
                            .replace('.', ',')}
                          %
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
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ background: '#FFC700' }}
              />
              Média ≥ 6,0
            </span>

            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E9E5D6] inline-block" />
              Média &lt; 6,0
            </span>

            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{
                  background: '#FFF1C2',
                  border: '1px solid #EAD98C',
                }}
              />
              Aguardando lançamento
            </span>
          </div>
        </>
      )}
    </div>
  );
}