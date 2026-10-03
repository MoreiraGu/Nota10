import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ApiError, api } from '../../services/api';
import type { TurmaAlunosApi } from '../../services/api';

import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Timeline, TimelineItem } from '../../components/ui/Timeline';
import { useToast } from '../../components/ui/Toast';


const iconAluno = (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="8" r="3.2" />
    <path
      strokeLinecap="round"
      d="M5.5 19c0-3.6 2.9-5.8 6.5-5.8s6.5 2.2 6.5 5.8"
    />
  </svg>
);


export function MinhasTurmaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [turma, setTurma] = useState<TurmaAlunosApi | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function carregarTurma() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const data = await api.getAlunosTurma(id);

        setTurma(data);

      } catch (error) {
        setTurma(null);

        if (error instanceof ApiError) {
          toast(error.message, 'error');
        } else {
          toast('Não foi possível carregar a turma.', 'error');
        }

      } finally {
        setLoading(false);
      }
    }

    carregarTurma();
  }, [id, toast]);


  if (loading) {
    return (
      <div className="text-center py-20 text-[#948F7C] text-sm">
        Carregando turma...
      </div>
    );
  }


  if (!turma) {
    return (
      <div className="text-center py-20 text-[#948F7C] text-sm">
        Turma não encontrada ou você não possui acesso.
      </div>
    );
  }


  const totalAlunos = turma.alunos.length;


  return (
    <div>
      <PageHeader
        title={turma.nome}
        description={`${totalAlunos} aluno${
          totalAlunos !== 1 ? 's' : ''
        } matriculado${totalAlunos !== 1 ? 's' : ''}`}
        backTo="/minhas-turmas"
        breadcrumbs={[
          {
            label: 'Minhas Turmas',
            href: '/minhas-turmas',
          },
          {
            label: turma.nome,
          },
        ]}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(`/minhas-turmas/${id}/notas`)
              }
            >
              Lançar notas
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(`/minhas-turmas/${id}/frequencia`)
              }
            >
              Lançar frequência
            </Button>
          </div>
        }
      />

      <h2 className="text-sm font-bold text-[#211C10] mb-4">
        Alunos matriculados
      </h2>

      {turma.alunos.length === 0 ? (
        <div className="card-surface-plain flex items-center justify-center py-14 text-[#948F7C] text-sm">
          Nenhum aluno matriculado nesta turma.
        </div>
      ) : (
        <Timeline>
          {turma.alunos.map((aluno, index, alunos) => (
            <TimelineItem
              key={aluno.aluno_id}
              icon={iconAluno}
              title={aluno.nome}
              meta={aluno.email}
              tone="neutral"
              isLast={index === alunos.length - 1}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() =>
                    navigate(`/minhas-turmas/${id}/notas`)
                  }
                  className="text-xs font-semibold hover:underline cursor-pointer"
                  style={{ color: '#8A6D00' }}
                >
                  Lançar notas
                </button>

                <button
                  onClick={() =>
                    navigate(`/minhas-turmas/${id}/frequencia`)
                  }
                  className="text-xs font-semibold hover:underline cursor-pointer"
                  style={{ color: '#8A6D00' }}
                >
                  Lançar frequência
                </button>
              </div>
            </TimelineItem>
          ))}
        </Timeline>
      )}
    </div>
  );
}