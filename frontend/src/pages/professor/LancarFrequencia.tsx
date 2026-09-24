import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { mockTurmas, mockFrequencia } from '../../data/mockData';
import type { Frequencia } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export function LancarFrequencia() {
  const { id } = useParams();
  const { toast } = useToast();
  const turma = mockTurmas.find(t => t.id === id);
  const [frequencias, setFrequencias] = useState<Frequencia[]>(
    turma?.alunosMatriculados.map(a => {
      const f = mockFrequencia.find(x => x.estudanteId === a.estudanteId);
      return f || { id: `f-${a.estudanteId}`, estudanteId: a.estudanteId, estudanteNome: a.nome, totalAulas: 20, totalPresencas: 0, percentual: null };
    }) || []
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!turma) return <div className="text-center py-20 text-sm text-[#948F7C]">Turma não encontrada.</div>;

  const updateFreq = (estudanteId: string, field: 'totalAulas' | 'totalPresencas', value: string) => {
    const num = parseInt(value) || 0;
    const key = `${field}-${estudanteId}`;
    if (num < 0) {
      setErrors(prev => ({ ...prev, [key]: 'Valor não pode ser negativo.' }));
    } else {
      setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
    }
    setFrequencias(prev => prev.map(f =>
      f.estudanteId === estudanteId ? { ...f, [field]: num } : f
    ));
  };

  const handleSave = async (estudanteId: string) => {
    setSaving(estudanteId);
    await new Promise(r => setTimeout(r, 900));
    setSaving(null);
    toast('Frequência salva com sucesso.');
  };

  return (
    <div>
      <PageHeader
        title={`Frequência — ${turma.disciplina}`}
        description={`Período ${turma.periodoLetivo} · Lançamento de frequência`}
        backTo={`/minhas-turmas/${id}`}
        breadcrumbs={[
          { label: 'Minhas Turmas', href: '/minhas-turmas' },
          { label: turma.disciplina, href: `/minhas-turmas/${id}` },
          { label: 'Lançar frequência' },
        ]}
      />

      <div className="bg-[#FFF7DD] border border-[#F0DFA0] rounded-lg px-4 py-3 mb-5 text-sm text-[#8A6D00]">
        O percentual de frequência é calculado pelo backend com base nos dados informados.
      </div>

      <div className="space-y-3">
        {frequencias.map(f => (
          <div key={f.estudanteId} className="card-surface px-5 py-4 flex items-center gap-6">
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#211C10]">{f.estudanteNome}</div>
            </div>

            <div className="flex items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#5B5645]">Total de aulas</label>
                <input
                  type="number"
                  min="0"
                  value={f.totalAulas}
                  onChange={e => updateFreq(f.estudanteId, 'totalAulas', e.target.value)}
                  className={`w-20 px-3 py-1.5 text-sm text-center border rounded-[6px] bg-white
                    ${errors[`totalAulas-${f.estudanteId}`] ? 'border-red-400' : 'border-[#D2CFC7] hover:border-[#E6A700]'}
                  `}
                />
                {errors[`totalAulas-${f.estudanteId}`] && (
                  <p className="text-xs text-red-600">{errors[`totalAulas-${f.estudanteId}`]}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#5B5645]">Presenças</label>
                <input
                  type="number"
                  min="0"
                  max={f.totalAulas}
                  value={f.totalPresencas}
                  onChange={e => updateFreq(f.estudanteId, 'totalPresencas', e.target.value)}
                  className={`w-20 px-3 py-1.5 text-sm text-center border rounded-[6px] bg-white
                    ${errors[`totalPresencas-${f.estudanteId}`] ? 'border-red-400' : 'border-[#D2CFC7] hover:border-[#E6A700]'}
                  `}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#5B5645]">Frequência</label>
                <div className="w-20 h-[34px] flex items-center justify-center bg-[#F5F7FA] border border-[#D2CFC7] rounded-[6px]">
                  {f.percentual !== null ? (
                    <span className={`text-sm font-semibold ${f.percentual >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {f.percentual}%
                    </span>
                  ) : (
                    <span className="text-sm text-[#948F7C]">–</span>
                  )}
                </div>
                <p className="text-[10px] text-[#948F7C] text-center">backend</p>
              </div>
            </div>

            <Button
              size="sm"
              loading={saving === f.estudanteId}
              onClick={() => handleSave(f.estudanteId)}
            >
              Salvar
            </Button>
          </div>
        ))}
      </div>

      {frequencias.length === 0 && (
        <div className="text-center py-16 text-[#948F7C]">
          <p className="text-sm">Nenhum aluno matriculado nesta turma.</p>
        </div>
      )}
    </div>
  );
}
