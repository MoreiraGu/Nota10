import { useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

export interface AlunoComFrequencia {
  aluno_id: number;
  nome: string;
  total_aulas: number;
  presencas: number;
  percentual: number | null;
}

interface Props {
  turmaId: string;
  aluno: AlunoComFrequencia;
}

const inputClass = 'w-20 px-3 py-1.5 text-sm text-center border border-[#D2CFC7] rounded-[6px] bg-white hover:border-[#E6A700]';

export function FrequenciaAlunoLinha({ turmaId, aluno }: Props) {
  const { toast } = useToast();
  const [totalAulas, setTotalAulas] = useState(String(aluno.total_aulas));
  const [presencas, setPresencas] = useState(String(aluno.presencas));
  const [percentual, setPercentual] = useState(aluno.percentual);
  const [saving, setSaving] = useState(false);

  const handleSalvar = async () => {
    const aulas = Number(totalAulas);
    const presentes = Number(presencas);

    if (aulas < 0 || presentes < 0) return toast('Os valores não podem ser negativos.', 'error');
    if (presentes > aulas) return toast('Presenças não podem ser maiores que o total de aulas.', 'error');

    setSaving(true);
    try {
      const resultado = await api.lancarFrequencia(turmaId, {
        aluno_id: aluno.aluno_id,
        total_aulas: aulas,
        presencas: presentes,
      });
      setPercentual(resultado.percentual);
      toast('Frequência salva com sucesso.');
    } catch (err: any) {
      toast(err?.message || 'Não foi possível salvar a frequência.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-surface px-5 py-4 flex flex-wrap items-end gap-6">
      <div className="flex-1 text-sm font-semibold text-[#211C10]">{aluno.nome}</div>

      <label className="flex flex-col gap-1 text-xs font-medium text-[#5B5645]">
        Total de aulas
        <input type="number" min="0" value={totalAulas} onChange={e => setTotalAulas(e.target.value)} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-[#5B5645]">
        Presenças
        <input type="number" min="0" value={presencas} onChange={e => setPresencas(e.target.value)} className={inputClass} />
      </label>

      <div className="flex flex-col gap-1 text-xs font-medium text-[#5B5645]">
        Frequência
        <span className="w-20 py-1.5 text-sm text-center font-semibold text-[#211C10]">
          {percentual === null ? '–' : `${percentual}%`}
        </span>
      </div>

      <Button size="sm" loading={saving} onClick={handleSalvar}>Salvar</Button>
    </div>
  );
}
