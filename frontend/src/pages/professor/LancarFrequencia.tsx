import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { Carregando, Erro, Vazio } from '../../components/ui/Estado';
import { FrequenciaAlunoLinha } from '../../components/professor/FrequenciaAlunoLinha';
import type { AlunoComFrequencia } from '../../components/professor/FrequenciaAlunoLinha';

async function buscarTurmaComFrequencia(turmaId: string) {
  const turma = await api.getAlunosTurma(turmaId);

  const alunos: AlunoComFrequencia[] = await Promise.all(
    turma.alunos.map(async aluno => {
      try {
        const freq = await api.getFrequencia(turmaId, aluno.aluno_id);
        return { aluno_id: aluno.aluno_id, nome: aluno.nome, total_aulas: freq.total_aulas, presencas: freq.presencas, percentual: freq.percentual };
      } catch {
        return { aluno_id: aluno.aluno_id, nome: aluno.nome, total_aulas: 0, presencas: 0, percentual: null };
      }
    })
  );

  return { nome: turma.nome, alunos };
}

export function LancarFrequencia() {
  const { id = '' } = useParams();
  const { data, loading, error, recarregar } = useApi(() => buscarTurmaComFrequencia(id), [id]);

  if (loading) return <Carregando texto="Carregando frequência..." />;
  if (error || !data) return <Erro texto={error || 'Turma não encontrada.'} onTentarNovamente={recarregar} />;

  return (
    <div>
      <PageHeader
        title={`Frequência — ${data.nome}`}
        description="Lançamento de frequência. O percentual é calculado pelo backend."
        backTo={`/minhas-turmas/${id}`}
        breadcrumbs={[
          { label: 'Minhas Turmas', href: '/minhas-turmas' },
          { label: data.nome, href: `/minhas-turmas/${id}` },
          { label: 'Lançar frequência' },
        ]}
      />

      {data.alunos.length === 0 ? (
        <Vazio texto="Nenhum aluno matriculado nesta turma." />
      ) : (
        <div className="space-y-3">
          {data.alunos.map(aluno => (
            <FrequenciaAlunoLinha key={aluno.aluno_id} turmaId={id} aluno={aluno} />
          ))}
        </div>
      )}
    </div>
  );
}
