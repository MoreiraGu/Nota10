import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { Carregando, Erro, Vazio } from '../../components/ui/Estado';
import { NotaAlunoCard } from '../../components/professor/NotaAlunoCard';
import type { AlunoComNotas } from '../../components/professor/NotaAlunoCard';

async function buscarTurmaComNotas(turmaId: string) {
  const turma = await api.getAlunosTurma(turmaId);

  const alunos: AlunoComNotas[] = await Promise.all(
    turma.alunos.map(async aluno => {
      try {
        const media = await api.getMedia(turmaId, aluno.aluno_id);
        return { ...aluno, notas: media.notas, media_final: media.media_final };
      } catch {
        return { ...aluno, notas: [], media_final: null };
      }
    })
  );

  return { nome: turma.nome, alunos };
}

export function LancarNotas() {
  const { id = '' } = useParams();
  const { data, loading, error, recarregar } = useApi(() => buscarTurmaComNotas(id), [id]);

  if (loading) return <Carregando texto="Carregando notas..." />;
  if (error || !data) return <Erro texto={error || 'Turma não encontrada.'} onTentarNovamente={recarregar} />;

  return (
    <div>
      <PageHeader
        title={`Notas — ${data.nome}`}
        description="Lançamento de notas por aluno. A média é calculada pelo backend."
        backTo={`/minhas-turmas/${id}`}
        breadcrumbs={[
          { label: 'Minhas Turmas', href: '/minhas-turmas' },
          { label: data.nome, href: `/minhas-turmas/${id}` },
          { label: 'Lançar notas' },
        ]}
      />

      {data.alunos.length === 0 ? (
        <Vazio texto="Nenhum aluno matriculado nesta turma." />
      ) : (
        <div className="space-y-5">
          {data.alunos.map(aluno => (
            <NotaAlunoCard key={aluno.aluno_id} turmaId={id} aluno={aluno} onSalvo={recarregar} />
          ))}
        </div>
      )}
    </div>
  );
}
