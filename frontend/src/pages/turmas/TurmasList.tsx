import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockTurmas } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Ficha, FichaIcons, FichaWatermarks } from '../../components/ui/Ficha';

export function TurmasList() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState('');

  const periodos = Array.from(new Set(mockTurmas.map(t => t.periodoLetivo))).sort().reverse();
  const filtered = mockTurmas.filter(t => !periodo || t.periodoLetivo === periodo);

  return (
    <div>
      <PageHeader
        title="Turmas"
        description="Gerencie as turmas abertas por período letivo."
        action={<Button onClick={() => navigate('/turmas/novo')}>+ Nova turma</Button>}
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
          className="px-4 py-2.5 text-sm border-[1.5px] border-[#D2CFC7] rounded-full bg-white cursor-pointer"
        >
          <option value="">Todos os períodos</option>
          {periodos.map(p => (
            <option key={p} value={p}>{p}{p === '2026.2' ? ' (atual)' : ''}</option>
          ))}
        </select>
        <span className="text-xs font-semibold text-[#948F7C] ml-auto">
          {filtered.length} turma{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm">Nenhuma turma encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(t => (
            <Ficha
              key={t.id}
              eyebrow={t.periodoLetivo === '2026.2' ? 'Período atual' : t.periodoLetivo}
              title={t.disciplina}
              muted={t.situacao !== 'ativa'}
              watermark={FichaWatermarks.turma}
              status={{ label: t.situacao === 'ativa' ? 'Ativa' : 'Encerrada', tone: t.situacao === 'ativa' ? 'ok' : 'off' }}
              stats={[
                { icon: FichaIcons.calendario, label: `Período ${t.periodoLetivo}` },
                { icon: FichaIcons.turma, label: `${t.totalAlunos} aluno${t.totalAlunos !== 1 ? 's' : ''} matriculado${t.totalAlunos !== 1 ? 's' : ''}` },
              ]}
              actions={
                <button onClick={() => navigate(`/turmas/${t.id}`)} className="text-xs font-bold hover:underline cursor-pointer" style={{ color: t.situacao !== 'ativa' ? '#8A6D00' : '#3A2E00' }}>
                  Ver detalhes →
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
