import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { Erro } from '../../components/ui/Estado';
import { ResumoStrip, Saudacao } from '../../components/dashboard/ResumoStrip';

export function DashboardProfessor({ nome }: { nome: string }) {
  const { data, loading, error, recarregar } = useApi(() => api.getMinhasTurmas());

  const turmas = data ?? [];
  const totalAlunos = turmas.reduce((total, turma) => total + turma.total_alunos, 0);

  return (
    <div>
      <Saudacao titulo={`Olá, ${nome}`} subtitulo="Resumo das suas turmas" />

      {error && <Erro texto={error} onTentarNovamente={recarregar} />}

      <div className="max-w-sm">
        <ResumoStrip
          items={[
            { label: 'Minhas turmas', value: loading ? '—' : turmas.length },
            { label: 'Total de alunos', value: loading ? '—' : totalAlunos },
          ]}
        />
      </div>
    </div>
  );
}
