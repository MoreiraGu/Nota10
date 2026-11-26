import type { ItemBoletim } from '../../types';
import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { Carregando, Erro, Vazio } from '../../components/ui/Estado';

function agruparPorPeriodo(itens: ItemBoletim[]) {
  const grupos: Record<string, ItemBoletim[]> = {};
  for (const item of itens) {
    const periodo = item.periodoLetivo || 'Sem período';
    if (!grupos[periodo]) grupos[periodo] = [];
    grupos[periodo].push(item);
  }
  return Object.entries(grupos).sort(([a], [b]) => b.localeCompare(a));
}

function formatar(valor: number | null, sufixo = '') {
  return valor === null ? '–' : `${valor.toFixed(1).replace('.', ',')}${sufixo}`;
}

export function MeuHistorico() {
  const { data, loading, error, recarregar } = useApi(() => api.getMeuBoletim());

  if (loading) return <Carregando texto="Carregando histórico..." />;

  const periodos = agruparPorPeriodo(data ?? []);

  return (
    <div>
      <PageHeader title="Meu Histórico" description="Suas disciplinas agrupadas por período letivo." />

      {error && <Erro texto={error} onTentarNovamente={recarregar} />}

      {periodos.length === 0 ? (
        <Vazio texto="Nenhuma disciplina no histórico." />
      ) : (
        periodos.map(([periodo, itens]) => (
          <section key={periodo} className="mb-8">
            <h2 className="text-base font-bold text-[#211C10] mb-3">{periodo}</h2>
            <table className="w-full card-surface-plain text-sm">
              <thead>
                <tr className="text-left text-xs text-[#948F7C] border-b border-[#EAD98C]">
                  <th className="px-4 py-3">Disciplina</th>
                  <th className="px-4 py-3">Média</th>
                  <th className="px-4 py-3">Frequência</th>
                  <th className="px-4 py-3">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1E9C8]">
                {itens.map(item => (
                  <tr key={item.turmaId}>
                    <td className="px-4 py-3 font-semibold text-[#211C10]">{item.disciplina}</td>
                    <td className="px-4 py-3">{formatar(item.media)}</td>
                    <td className="px-4 py-3">{formatar(item.frequencia, '%')}</td>
                    <td className="px-4 py-3">{item.situacaoLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))
      )}
    </div>
  );
}
