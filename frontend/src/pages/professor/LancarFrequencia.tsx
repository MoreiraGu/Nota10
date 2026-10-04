import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ApiError, api } from '../../services/api';
import type { Frequencia } from '../../types';

import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';


interface TurmaInfo {
  id: number;
  nome: string;
}


export function LancarFrequencia() {
  const { id } = useParams();
  const { toast } = useToast();

  const [turma, setTurma] = useState<TurmaInfo | null>(null);
  const [frequencias, setFrequencias] = useState<Frequencia[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});


  useEffect(() => {
    async function carregarDados() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Primeiro busca os alunos reais matriculados na turma
        const turmaData = await api.getAlunosTurma(id);

        setTurma({
          id: turmaData.turma_id,
          nome: turmaData.nome,
        });

        // Para cada aluno, tenta buscar a frequência já lançada
        const dadosFrequencia = await Promise.all(
          turmaData.alunos.map(async aluno => {
            try {
              const freq = await api.getFrequencia(
                turmaData.turma_id,
                aluno.aluno_id
              );

              return {
                id: `freq-${aluno.aluno_id}`,
                estudanteId: String(aluno.aluno_id),
                estudanteNome: aluno.nome,
                totalAulas: freq.total_aulas,
                totalPresencas: freq.presencas,
                percentual: freq.percentual,
              } satisfies Frequencia;

            } catch (error) {
              // 404 significa que o aluno está matriculado,
              // mas ainda não possui frequência lançada.
              if (error instanceof ApiError && error.status === 404) {
                return {
                  id: `freq-${aluno.aluno_id}`,
                  estudanteId: String(aluno.aluno_id),
                  estudanteNome: aluno.nome,
                  totalAulas: 0,
                  totalPresencas: 0,
                  percentual: null,
                } satisfies Frequencia;
              }

              throw error;
            }
          })
        );

        setFrequencias(dadosFrequencia);

      } catch (error) {
        if (error instanceof ApiError) {
          toast(error.message, 'error');
        } else {
          toast('Não foi possível carregar a turma.', 'error');
        }

        setTurma(null);
        setFrequencias([]);

      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [id, toast]);


  const updateFreq = (
    estudanteId: string,
    field: 'totalAulas' | 'totalPresencas',
    value: string
  ) => {
    const num = value === '' ? 0 : Number(value);
    const key = `${field}-${estudanteId}`;

    if (num < 0) {
      setErrors(prev => ({
        ...prev,
        [key]: 'Valor não pode ser negativo.',
      }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

    setFrequencias(prev =>
      prev.map(f =>
        f.estudanteId === estudanteId
          ? {
              ...f,
              [field]: num,
              // O percentual só deve mudar depois que o backend responder.
              percentual: null,
            }
          : f
      )
    );
  };


  const handleSave = async (estudanteId: string) => {
    if (!id) return;

    const frequencia = frequencias.find(
      f => f.estudanteId === estudanteId
    );

    if (!frequencia) return;

    if (frequencia.totalAulas < 0 || frequencia.totalPresencas < 0) {
      toast(
        'Total de aulas e presenças não podem ser negativos.',
        'error'
      );
      return;
    }

    if (frequencia.totalPresencas > frequencia.totalAulas) {
      toast(
        'Presenças não podem ser maiores que o total de aulas.',
        'error'
      );
      return;
    }

    try {
      setSaving(estudanteId);

      const resultado = await api.lancarFrequencia(id, {
        aluno_id: Number(estudanteId),
        total_aulas: frequencia.totalAulas,
        presencas: frequencia.totalPresencas,
      });

      // Atualiza usando o percentual devolvido pelo backend.
      setFrequencias(prev =>
        prev.map(f =>
          f.estudanteId === estudanteId
            ? {
                ...f,
                totalAulas: resultado.total_aulas,
                totalPresencas: resultado.presencas,
                percentual: resultado.percentual,
              }
            : f
        )
      );

      toast('Frequência salva com sucesso.');

    } catch (error) {
      if (error instanceof ApiError) {
        toast(error.message, 'error');
      } else {
        toast('Não foi possível salvar a frequência.', 'error');
      }

    } finally {
      setSaving(null);
    }
  };


  if (loading) {
    return (
      <div className="text-center py-20 text-sm text-[#948F7C]">
        Carregando frequência...
      </div>
    );
  }


  if (!turma) {
    return (
      <div className="text-center py-20 text-sm text-[#948F7C]">
        Turma não encontrada ou você não possui acesso.
      </div>
    );
  }


  return (
    <div>
      <PageHeader
        title={`Frequência — ${turma.nome}`}
        description="Lançamento de frequência"
        backTo={`/minhas-turmas/${id}`}
        breadcrumbs={[
          {
            label: 'Minhas Turmas',
            href: '/minhas-turmas',
          },
          {
            label: turma.nome,
            href: `/minhas-turmas/${id}`,
          },
          {
            label: 'Lançar frequência',
          },
        ]}
      />

      <div className="bg-[#FFF7DD] border border-[#F0DFA0] rounded-lg px-4 py-3 mb-5 text-sm text-[#8A6D00]">
        O percentual de frequência é calculado pelo backend com base
        nos dados informados.
      </div>

      <div className="space-y-3">
        {frequencias.map(f => (
          <div
            key={f.estudanteId}
            className="card-surface px-5 py-4 flex items-center gap-6"
          >
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#211C10]">
                {f.estudanteNome}
              </div>
            </div>

            <div className="flex items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#5B5645]">
                  Total de aulas
                </label>

                <input
                  type="number"
                  min="0"
                  value={f.totalAulas}
                  onChange={e =>
                    updateFreq(
                      f.estudanteId,
                      'totalAulas',
                      e.target.value
                    )
                  }
                  className={`w-20 px-3 py-1.5 text-sm text-center border rounded-[6px] bg-white
                    ${
                      errors[`totalAulas-${f.estudanteId}`]
                        ? 'border-red-400'
                        : 'border-[#D2CFC7] hover:border-[#E6A700]'
                    }
                  `}
                />

                {errors[`totalAulas-${f.estudanteId}`] && (
                  <p className="text-xs text-red-600">
                    {errors[`totalAulas-${f.estudanteId}`]}
                  </p>
                )}
              </div>


              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#5B5645]">
                  Presenças
                </label>

                <input
                  type="number"
                  min="0"
                  max={f.totalAulas}
                  value={f.totalPresencas}
                  onChange={e =>
                    updateFreq(
                      f.estudanteId,
                      'totalPresencas',
                      e.target.value
                    )
                  }
                  className={`w-20 px-3 py-1.5 text-sm text-center border rounded-[6px] bg-white
                    ${
                      errors[`totalPresencas-${f.estudanteId}`]
                        ? 'border-red-400'
                        : 'border-[#D2CFC7] hover:border-[#E6A700]'
                    }
                  `}
                />
              </div>


              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#5B5645]">
                  Frequência
                </label>

                <div className="w-20 h-[34px] flex items-center justify-center bg-[#F5F7FA] border border-[#D2CFC7] rounded-[6px]">
                  {f.percentual !== null ? (
                    <span
                      className={`text-sm font-semibold ${
                        f.percentual >= 75
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {f.percentual}%
                    </span>
                  ) : (
                    <span className="text-sm text-[#948F7C]">
                      –
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-[#948F7C] text-center">
                  backend
                </p>
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
          <p className="text-sm">
            Nenhum aluno matriculado nesta turma.
          </p>
        </div>
      )}
    </div>
  );
}