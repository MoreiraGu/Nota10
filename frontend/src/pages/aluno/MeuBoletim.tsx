import { useEffect, useMemo, useState } from 'react';

import type { ItemBoletim, SituacaoAcademica } from '../../types';
import { api } from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';

type FiltroSituacao = 'TODAS' | 'APROVADO' | 'ATENCAO' | 'EM_ANDAMENTO';

function getSituacaoConfig(situacao: SituacaoAcademica) {
  switch (situacao) {
    case 'APROVADO':
      return {
        badgeVariant: 'success' as const,
        borderClass: 'border-[#EAD98C]',
        accentBg: 'bg-emerald-500',
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    case 'RECUPERACAO':
      return {
        badgeVariant: 'warning' as const,
        borderClass: 'border-amber-300',
        accentBg: 'bg-amber-500',
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              d="M12 9v2m0 4h.01M10.29 3.86l-8.4 14.5A1 1 0 002.76 20h18.48a1 1 0 00.87-1.5l-8.4-14.5a1 1 0 00-1.74 0z"
            />
          </svg>
        ),
      };
    case 'REPROVADO':
      return {
        badgeVariant: 'error' as const,
        borderClass: 'border-red-300',
        accentBg: 'bg-red-500',
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      };
    case 'EM_ANDAMENTO':
    default:
      return {
        badgeVariant: 'info' as const,
        borderClass: 'border-[#EAD98C]',
        accentBg: 'bg-[#FFC700]',
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      };
  }
}

export function MeuBoletim() {
  const [boletim, setBoletim] = useState<ItemBoletim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroSituacao>('TODAS');
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function carregarBoletim() {
      setLoading(true);
      setError(null);

      try {
        const data = await api.getMeuBoletim();
        setBoletim(data);
      } catch (err: any) {
        setError(err?.message || 'Não foi possível carregar o boletim.');
      } finally {
        setLoading(false);
      }
    }

    carregarBoletim();
  }, []);

  const toggleExpandir = (turmaId: string) => {
    setExpandidos(prev => ({
      ...prev,
      [turmaId]: !prev[turmaId],
    }));
  };

  const resumo = useMemo(() => {
    const mediasValidas = boletim
      .map(b => b.media)
      .filter((m): m is number => m !== null);

    const freqsValidas = boletim
      .map(b => b.frequencia)
      .filter((f): f is number => f !== null);

    const mediaGeral =
      mediasValidas.length > 0
        ? mediasValidas.reduce((acc, v) => acc + v, 0) / mediasValidas.length
        : null;

    const frequenciaGlobal =
      freqsValidas.length > 0
        ? freqsValidas.reduce((acc, v) => acc + v, 0) / freqsValidas.length
        : null;

    const aprovadas = boletim.filter(b => b.situacao === 'APROVADO').length;
    const emAtencao = boletim.filter(
      b => b.situacao === 'RECUPERACAO' || b.situacao === 'REPROVADO'
    ).length;
    const emAndamento = boletim.filter(b => b.situacao === 'EM_ANDAMENTO').length;

    return {
      mediaGeral,
      frequenciaGlobal,
      aprovadas,
      emAtencao,
      emAndamento,
    };
  }, [boletim]);

  const itensFiltrados = useMemo(() => {
    switch (filtro) {
      case 'APROVADO':
        return boletim.filter(b => b.situacao === 'APROVADO');
      case 'ATENCAO':
        return boletim.filter(
          b => b.situacao === 'RECUPERACAO' || b.situacao === 'REPROVADO'
        );
      case 'EM_ANDAMENTO':
        return boletim.filter(b => b.situacao === 'EM_ANDAMENTO');
      case 'TODAS':
      default:
        return boletim;
    }
  }, [boletim, filtro]);

  return (
    <div>
      <PageHeader
        title="Meu Boletim"
        description="Acompanhe suas notas, médias, frequência e situação acadêmica oficial em cada disciplina."
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="bg-white rounded-[12px] border-[1.5px] border-[#EAD98C] p-5 h-28 animate-pulse"
              />
            ))}
          </div>
          <div className="bg-white rounded-[12px] border-[1.5px] border-[#EAD98C] p-6 h-44 animate-pulse" />
        </div>
      ) : boletim.length === 0 ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm font-medium text-[#5B5645]">
            Nenhuma turma matriculada encontrada.
          </p>
        </div>
      ) : (
        <>
          {/* Cards de Resumo Consolidado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Card 1: Média Geral */}
            <div className="bg-white rounded-[12px] border-[1.5px] border-[#EAD98C] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#948F7C]">
                  Média Geral
                </span>
                <span className="text-[11px] font-medium text-[#8A6D00] bg-[#FFF9E6] border border-[#EAD98C] px-2 py-0.5 rounded-full">
                  Corte: 6,0
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-extrabold text-[#211C10]">
                  {resumo.mediaGeral !== null
                    ? resumo.mediaGeral.toFixed(2).replace('.', ',')
                    : '–'}
                </span>
                <span className="text-xs text-[#948F7C]">/ 10,0</span>
              </div>
              <div className="relative w-full h-2 bg-[#F1E9C8] rounded-full overflow-visible">
                <div
                  className={`h-full rounded-full transition-all ${
                    resumo.mediaGeral === null
                      ? 'bg-[#D9CE9E]'
                      : resumo.mediaGeral >= 6
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                  }`}
                  style={{
                    width: `${resumo.mediaGeral !== null ? Math.min(resumo.mediaGeral * 10, 100) : 0}%`,
                  }}
                />
                <div
                  className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-[#211C10]"
                  style={{ left: '60%' }}
                  title="Média mínima: 6,0"
                />
              </div>
            </div>

            {/* Card 2: Frequência Global */}
            <div className="bg-white rounded-[12px] border-[1.5px] border-[#EAD98C] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#948F7C]">
                  Frequência Global
                </span>
                <span className="text-[11px] font-medium text-[#8A6D00] bg-[#FFF9E6] border border-[#EAD98C] px-2 py-0.5 rounded-full">
                  Mínimo: 75%
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-2xl font-extrabold text-[#211C10]">
                  {resumo.frequenciaGlobal !== null
                    ? `${resumo.frequenciaGlobal.toFixed(1).replace('.', ',')}%`
                    : '–'}
                </span>
                <span className="text-xs text-[#948F7C]">de presença</span>
              </div>
              <div className="relative w-full h-2 bg-[#F1E9C8] rounded-full overflow-visible">
                <div
                  className={`h-full rounded-full transition-all ${
                    resumo.frequenciaGlobal === null
                      ? 'bg-[#D9CE9E]'
                      : resumo.frequenciaGlobal >= 75
                        ? 'bg-emerald-500'
                        : 'bg-red-500'
                  }`}
                  style={{
                    width: `${resumo.frequenciaGlobal !== null ? Math.min(resumo.frequenciaGlobal, 100) : 0}%`,
                  }}
                />
                <div
                  className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-[#211C10]"
                  style={{ left: '75%' }}
                  title="Frequência mínima: 75%"
                />
              </div>
            </div>

            {/* Card 3: Situação das Disciplinas */}
            <div className="bg-white rounded-[12px] border-[1.5px] border-[#EAD98C] p-5 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#948F7C] mb-2">
                Panorama ({boletim.length} {boletim.length === 1 ? 'disciplina' : 'disciplinas'})
              </span>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">{resumo.aprovadas} Aprovada(s)</Badge>
                <Badge variant="info">{resumo.emAndamento} Em andamento</Badge>
                {resumo.emAtencao > 0 && (
                  <Badge variant="warning">{resumo.emAtencao} Em atenção</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Abas de Filtro por Situação */}
          <div className="flex flex-wrap items-center gap-2 mb-5 border-b border-[#EAD98C] pb-3">
            {(
              [
                { id: 'TODAS', label: `Todas (${boletim.length})` },
                { id: 'APROVADO', label: `Aprovadas (${resumo.aprovadas})` },
                { id: 'ATENCAO', label: `Em atenção / Recuperação (${resumo.emAtencao})` },
                { id: 'EM_ANDAMENTO', label: `Em andamento (${resumo.emAndamento})` },
              ] as const
            ).map(tab => {
              const ativo = filtro === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltro(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    ativo
                      ? 'bg-[#FFC700] text-[#33290A] shadow-xs'
                      : 'bg-white text-[#5B5645] border border-[#EAD98C] hover:bg-[#FFF9E6]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Lista Interativa de Disciplinas */}
          {itensFiltrados.length === 0 ? (
            <div className="bg-white rounded-[12px] border-[1.5px] border-[#EAD98C] py-12 text-center text-sm text-[#948F7C]">
              Nenhuma disciplina encontrada para o filtro selecionado.
            </div>
          ) : (
            <div className="space-y-4">
              {itensFiltrados.map(item => {
                const config = getSituacaoConfig(item.situacao);
                const aberto = !!expandidos[item.turmaId];

                const mediaPercent =
                  item.media !== null ? Math.min(Math.max(item.media * 10, 0), 100) : 0;
                const freqPercent =
                  item.frequencia !== null ? Math.min(Math.max(item.frequencia, 0), 100) : 0;

                return (
                  <div
                    key={item.turmaId}
                    className={`bg-white rounded-[12px] border-[1.5px] ${config.borderClass} overflow-hidden transition-shadow hover:shadow-md`}
                  >
                    <div
                      onClick={() => toggleExpandir(item.turmaId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleExpandir(item.turmaId);
                        }
                      }}
                      className="p-5 cursor-pointer select-none"
                    >
                      {/* Cabeçalho do Card */}
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-base font-bold text-[#211C10]">
                              {item.disciplina}
                            </h3>
                            {item.periodoLetivo && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#FFF9E6] text-[#8A6D00] border border-[#EAD98C]">
                                {item.periodoLetivo}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#5B5645] mt-1">
                            {item.situacaoDetalhe}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Badge variant={config.badgeVariant}>
                            <span className="inline-flex items-center gap-1.5">
                              {config.icon}
                              {item.situacaoLabel}
                            </span>
                          </Badge>

                          <span
                            className="text-xs text-[#8A6D00] font-semibold inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-[#FFF9E6]"
                            aria-expanded={aberto}
                          >
                            {aberto ? 'Ocultar' : 'Detalhes'}
                            <svg
                              className={`w-3.5 h-3.5 transition-transform ${aberto ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </span>
                        </div>
                      </div>

                      {/* Barras Visuais de Média e Frequência */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                        {/* Barra de Média */}
                        <div className="bg-[#FAF9F5] border border-[#F1E9C8] rounded-lg p-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-[#5B5645]">
                              Média Calculada
                            </span>
                            <span
                              className={`font-bold text-sm ${
                                item.media === null
                                  ? 'text-[#B08A00]'
                                  : item.media >= 6
                                    ? 'text-emerald-700'
                                    : item.media >= 4
                                      ? 'text-amber-700'
                                      : 'text-red-700'
                              }`}
                            >
                              {item.media === null
                                ? 'Aguardando'
                                : item.media.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <div className="relative w-full h-2.5 bg-[#E9E5D6] rounded-full overflow-visible">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.media === null
                                  ? 'bg-transparent'
                                  : item.media >= 6
                                    ? 'bg-emerald-500'
                                    : item.media >= 4
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
                              }`}
                              style={{ width: `${mediaPercent}%` }}
                            />
                            <div
                              className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-[#211C10]"
                              style={{ left: '60%' }}
                              title="Corte de aprovação: 6,0"
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-[#948F7C] mt-1">
                            <span>0,0</span>
                            <span className="font-semibold text-[#5B5645]">Corte: 6,0</span>
                            <span>10,0</span>
                          </div>
                        </div>

                        {/* Barra de Frequência */}
                        <div className="bg-[#FAF9F5] border border-[#F1E9C8] rounded-lg p-3">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-[#5B5645]">
                              Frequência
                            </span>
                            <span
                              className={`font-bold text-sm ${
                                item.frequencia === null
                                  ? 'text-[#B08A00]'
                                  : item.frequencia >= 75
                                    ? 'text-emerald-700'
                                    : 'text-red-700'
                              }`}
                            >
                              {item.frequencia === null
                                ? 'Não lançada'
                                : `${item.frequencia.toFixed(1).replace('.', ',')}%`}
                            </span>
                          </div>
                          <div className="relative w-full h-2.5 bg-[#E9E5D6] rounded-full overflow-visible">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.frequencia === null
                                  ? 'bg-transparent'
                                  : item.frequencia >= 75
                                    ? 'bg-emerald-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${freqPercent}%` }}
                            />
                            <div
                              className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-[#211C10]"
                              style={{ left: '75%' }}
                              title="Mínimo exigido: 75%"
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-[#948F7C] mt-1">
                            <span>0%</span>
                            <span className="font-semibold text-[#5B5645]">Mínimo: 75%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>

                      {/* Chips de Avaliações */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-[#948F7C] mr-1">
                          Avaliações:
                        </span>
                        {item.notas.length === 0 ? (
                          <span className="text-xs italic text-[#948F7C]">
                            Nenhuma avaliação registrada
                          </span>
                        ) : (
                          item.notas.map((nota, idx) => (
                            <span
                              key={`${item.turmaId}-nota-${idx}`}
                              className="inline-flex items-center gap-1.5 bg-[#FFF9E6] border border-[#EAD98C] rounded-full px-3 py-1 text-xs"
                            >
                              <span className="text-[#5B5645] font-medium">
                                {nota.tipo}:
                              </span>
                              <span
                                className={`font-bold ${
                                  nota.valor === null
                                    ? 'text-[#B08A00]'
                                    : nota.valor >= 6
                                      ? 'text-emerald-700'
                                      : 'text-red-700'
                                }`}
                              >
                                {nota.valor === null
                                  ? 'Pendente'
                                  : nota.valor.toFixed(1).replace('.', ',')}
                              </span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Painel Expandido de Detalhes */}
                    {aberto && (
                      <div className="bg-[#FFFBEF] border-t border-[#F1E9C8] px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="block text-[#948F7C] font-medium mb-0.5">
                            Total de Aulas Ministradas
                          </span>
                          <span className="text-sm font-bold text-[#211C10]">
                            {item.totalAulas !== null ? `${item.totalAulas} aulas` : 'Não informado'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[#948F7C] font-medium mb-0.5">
                            Presenças Registradas
                          </span>
                          <span className="text-sm font-bold text-emerald-700">
                            {item.presencas !== null ? `${item.presencas} presenças` : '–'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[#948F7C] font-medium mb-0.5">
                            Faltas Acumuladas
                          </span>
                          <span className="text-sm font-bold text-red-700">
                            {item.faltas !== null ? `${item.faltas} faltas` : '–'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legenda Oficial */}
          <div className="mt-6 pt-4 border-t border-[#F1E9C8] flex flex-wrap items-center gap-5 text-xs text-[#5B5645]">
            <span className="font-semibold text-[#211C10]">Critérios oficiais:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Aprovado (Média ≥ 6,0 e Freq. ≥ 75%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Em recuperação (Média entre 4,0 e 5,9)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Reprovado (Média menor que 4,0 ou Freq. menor que 75%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFC700] inline-block" />
              Em andamento (Notas ou frequência pendentes)
            </span>
          </div>
        </>
      )}
    </div>
  );
}