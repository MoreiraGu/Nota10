import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { mockTurmas } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Ficha, FichaIcons, FichaWatermarks } from '../../components/ui/Ficha';

export function MinhasTurmas() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const minhasTurmas = mockTurmas.filter(t =>
    t.professoresVinculados.some(p => p.professorId === user?.professorId)
  );

  return (
    <div>
      <PageHeader title="Minhas Turmas" description="Turmas em que você está vinculado como professor." />

      {minhasTurmas.length === 0 ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm font-medium">Você não está vinculado a nenhuma turma.</p>
          <p className="text-xs mt-1">Entre em contato com a Coordenação.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {minhasTurmas.map(t => (
            <Ficha
              key={t.id}
              eyebrow={`Período ${t.periodoLetivo}`}
              title={t.disciplina}
              muted={t.situacao !== 'ativa'}
              watermark={FichaWatermarks.turma}
              status={{ label: t.situacao === 'ativa' ? 'Ativa' : 'Encerrada', tone: t.situacao === 'ativa' ? 'ok' : 'off' }}
              stats={[
                { icon: FichaIcons.turma, label: `${t.totalAlunos} aluno${t.totalAlunos !== 1 ? 's' : ''} matriculado${t.totalAlunos !== 1 ? 's' : ''}` },
              ]}
              actions={
                <button onClick={() => navigate(`/minhas-turmas/${t.id}`)} className="text-xs font-bold hover:underline cursor-pointer" style={{ color: t.situacao !== 'ativa' ? '#8A6D00' : '#3A2E00' }}>
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
