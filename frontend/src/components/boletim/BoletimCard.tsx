import type { ItemBoletim, SituacaoAcademica } from '../../types';
import { Badge } from '../ui/Badge';

const corDaSituacao: Record<SituacaoAcademica, 'success' | 'warning' | 'error' | 'info'> = {
  APROVADO: 'success',
  RECUPERACAO: 'warning',
  REPROVADO: 'error',
  EM_ANDAMENTO: 'info',
};

function formatar(valor: number | null, casas = 1) {
  if (valor === null) return '–';
  return valor.toFixed(casas).replace('.', ',');
}

export function BoletimCard({ item }: { item: ItemBoletim }) {
  return (
    <div className="card-surface-plain p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[#211C10]">{item.disciplina}</h3>
          {item.periodoLetivo && <p className="text-xs text-[#948F7C]">{item.periodoLetivo}</p>}
          <p className="text-xs text-[#5B5645] mt-1">{item.situacaoDetalhe}</p>
        </div>
        <Badge variant={corDaSituacao[item.situacao]}>{item.situacaoLabel}</Badge>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {item.notas.length === 0 ? (
          <span className="text-xs italic text-[#948F7C]">Nenhuma avaliação registrada</span>
        ) : (
          item.notas.map((nota, i) => (
            <span key={i} className="bg-[#FFF9E6] border border-[#EAD98C] rounded-full px-3 py-1 text-xs">
              {nota.tipo}: <strong>{nota.valor === null ? 'Pendente' : formatar(nota.valor)}</strong>
            </span>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-[#5B5645]">
        <Info titulo="Média" valor={formatar(item.media, 2)} />
        <Info titulo="Frequência" valor={item.frequencia === null ? '–' : `${formatar(item.frequencia)}%`} />
        <Info titulo="Aulas" valor={item.totalAulas ?? '–'} />
        <Info titulo="Faltas" valor={item.faltas ?? '–'} />
      </div>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div>
      <span className="block text-[#948F7C]">{titulo}</span>
      <span className="text-sm font-bold text-[#211C10]">{valor}</span>
    </div>
  );
}
