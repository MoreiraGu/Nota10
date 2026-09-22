import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { mockTurmas, mockNotas } from '../../data/mockData';
import type { Nota } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export function LancarNotas() {
  const { id } = useParams();
  const { toast } = useToast();
  const turma = mockTurmas.find(t => t.id === id);
  const [notas, setNotas] = useState<Nota[]>(mockNotas.filter(n =>
    turma?.alunosMatriculados.some(a => a.estudanteId === n.estudanteId)
  ));
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!turma) return <div className="text-center py-20 text-sm text-[#948F7C]">Turma não encontrada.</div>;

  const estudantes = turma.alunosMatriculados;

  const getNotas = (estudanteId: string) => notas.filter(n => n.estudanteId === estudanteId);

  const updateNota = (notaId: string, valor: string) => {
    const num = valor === '' ? null : parseFloat(valor.replace(',', '.'));
    const key = `nota-${notaId}`;
    if (num !== null && (isNaN(num) || num < 0 || num > 10)) {
      setErrors(prev => ({ ...prev, [key]: 'Nota deve ser entre 0 e 10.' }));
    } else {
      setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
    }
    setNotas(prev => prev.map(n => n.id === notaId ? { ...n, valor: num } : n));
  };

  const handleSave = async (estudanteId: string) => {
    const notasAluno = getNotas(estudanteId);
    const hasError = notasAluno.some(n => errors[`nota-${n.id}`]);
    if (hasError) return;
    setSaving(estudanteId);
    await new Promise(r => setTimeout(r, 900));
    setSaving(null);
    toast('Notas salvas com sucesso.');
  };

  return (
    <div>
      <PageHeader
        title={`Notas — ${turma.disciplina}`}
        description={`Período ${turma.periodoLetivo} · Lançamento de notas`}
        backTo={`/minhas-turmas/${id}`}
        breadcrumbs={[
          { label: 'Minhas Turmas', href: '/minhas-turmas' },
          { label: turma.disciplina, href: `/minhas-turmas/${id}` },
          { label: 'Lançar notas' },
        ]}
      />

      <div className="space-y-4">
        {estudantes.map(aluno => {
          const notasAluno = getNotas(aluno.estudanteId);
          const media = notasAluno[0]?.mediaAtual;
          return (
            <div key={aluno.estudanteId} className="card-surface overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAD98C]">
                <div>
                  <div className="text-sm font-semibold text-[#211C10]">{aluno.nome}</div>
                  <div className="text-xs text-[#948F7C]">{aluno.email}</div>
                </div>
                <div className="flex items-center gap-4">
                  {media !== null && media !== undefined && (
                    <div className="text-sm">
                      <span className="text-[#5B5645]">Média atual: </span>
                      <span className={`font-semibold ${media >= 6 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {media.toFixed(1).replace('.', ',')}
                      </span>
                      <span className="text-xs text-[#948F7C] ml-1">(calculada pelo backend)</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    loading={saving === aluno.estudanteId}
                    onClick={() => handleSave(aluno.estudanteId)}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-[#F1E9C8]">
                {notasAluno.map(nota => (
                  <div key={nota.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 text-sm text-[#211C10] font-medium">{nota.tipoAvaliacao}</div>
                    <div className="text-xs text-[#948F7C]">Peso {nota.peso}</div>
                    <div className="flex flex-col gap-1">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="–"
                        value={nota.valor === null ? '' : nota.valor}
                        onChange={e => updateNota(nota.id, e.target.value)}
                        className={`w-20 px-3 py-1.5 text-sm text-center border rounded-[6px] bg-white
                          ${errors[`nota-${nota.id}`] ? 'border-red-400' : 'border-[#D2CFC7] hover:border-[#E6A700]'}
                        `}
                      />
                      {errors[`nota-${nota.id}`] && (
                        <p className="text-xs text-red-600">{errors[`nota-${nota.id}`]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {estudantes.length === 0 && (
        <div className="text-center py-16 text-[#948F7C]">
          <p className="text-sm">Nenhum aluno matriculado nesta turma.</p>
        </div>
      )}
    </div>
  );
}
