import { useNavigate, useParams } from 'react-router-dom';
import { mockTurmas } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Timeline, TimelineItem } from '../../components/ui/Timeline';

const iconAluno = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="3.2" />
    <path strokeLinecap="round" d="M5.5 19c0-3.6 2.9-5.8 6.5-5.8s6.5 2.2 6.5 5.8" />
  </svg>
);

export function MinhasTurmaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = mockTurmas.find(t => t.id === id);

  if (!turma) return <div className="text-center py-20 text-[#948F7C] text-sm">Turma não encontrada.</div>;

  return (
    <div>
      <PageHeader
        title={turma.disciplina}
        description={`Período ${turma.periodoLetivo} · ${turma.totalAlunos} aluno${turma.totalAlunos !== 1 ? 's' : ''}`}
        backTo="/minhas-turmas"
        breadcrumbs={[{ label: 'Minhas Turmas', href: '/minhas-turmas' }, { label: turma.disciplina }]}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/minhas-turmas/${id}/notas`)}>
              Lançar notas
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/minhas-turmas/${id}/frequencia`)}>
              Lançar frequência
            </Button>
          </div>
        }
      />

      <h2 className="text-sm font-bold text-[#211C10] mb-4">Alunos matriculados</h2>

      {turma.alunosMatriculados.length === 0 ? (
        <div className="card-surface-plain flex items-center justify-center py-14 text-[#948F7C] text-sm">
          Nenhum aluno matriculado nesta turma.
        </div>
      ) : (
        <Timeline>
          {turma.alunosMatriculados.map((a, i, arr) => (
            <TimelineItem
              key={a.estudanteId}
              icon={iconAluno}
              title={a.nome}
              meta={a.email}
              tone="neutral"
              isLast={i === arr.length - 1}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(`/minhas-turmas/${id}/notas`)}
                  className="text-xs font-semibold hover:underline cursor-pointer"
                  style={{ color: '#8A6D00' }}
                >
                  Lançar notas
                </button>
                <button
                  onClick={() => navigate(`/minhas-turmas/${id}/frequencia`)}
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
