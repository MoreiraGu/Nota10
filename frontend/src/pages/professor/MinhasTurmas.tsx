import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { Ficha, FichaIcons, FichaWatermarks } from '../../components/ui/Ficha';
import { Carregando, Erro, Vazio } from '../../components/ui/Estado';

export function MinhasTurmas() {
  const navigate = useNavigate();
  const { data: turmas, loading, error, recarregar } = useApi(() => api.getMinhasTurmas());

  return (
    <div>
      <PageHeader
        title="Minhas Turmas"
        description="Turmas em que você está vinculado como professor."
      />

      {error && <Erro texto={error} onTentarNovamente={recarregar} />}

      {loading ? (
        <Carregando texto="Carregando turmas..." />
      ) : !turmas || turmas.length === 0 ? (
        <Vazio texto="Você não está vinculado a nenhuma turma. Entre em contato com a Coordenação." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {turmas.map(turma => (
            <Ficha
              key={turma.turma_id}
              eyebrow={`Turma #${turma.turma_id}`}
              title={turma.nome}
              watermark={FichaWatermarks.turma}
              stats={[{ icon: FichaIcons.turma, label: `${turma.total_alunos} aluno(s) matriculado(s)` }]}
              actions={
                <button
                  onClick={() => navigate(`/minhas-turmas/${turma.turma_id}`)}
                  className="text-xs font-bold hover:underline cursor-pointer text-[#3A2E00]"
                >
                  Ver turma →
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
