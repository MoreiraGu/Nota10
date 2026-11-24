import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Ficha, FichaIcons, FichaWatermarks } from '../../components/ui/Ficha';
import { Carregando, Erro, Vazio } from '../../components/ui/Estado';

export function TurmasList() {
  const navigate = useNavigate();
  const { data, loading, error, recarregar } = useApi(() => api.getTurmas());
  const [periodo, setPeriodo] = useState('');

  const turmas = data ?? [];
  const periodos = Array.from(new Set(turmas.map(t => t.periodo_letivo))).sort().reverse();
  const filtradas = turmas.filter(t => !periodo || t.periodo_letivo === periodo);

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
          {periodos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-xs font-semibold text-[#948F7C] ml-auto">
          {filtradas.length} turma(s) encontrada(s)
        </span>
      </div>

      {error && <Erro texto={error} onTentarNovamente={recarregar} />}

      {loading ? (
        <Carregando texto="Carregando turmas..." />
      ) : filtradas.length === 0 ? (
        <Vazio texto="Nenhuma turma encontrada.">
          <Button size="sm" onClick={() => navigate('/turmas/novo')}>Criar primeira turma</Button>
        </Vazio>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtradas.map(t => {
            const ativa = t.situacao === 'ATIVA';
            return (
              <Ficha
                key={t.id}
                eyebrow={t.periodo_letivo}
                title={t.disciplina}
                muted={!ativa}
                watermark={FichaWatermarks.turma}
                status={{ label: ativa ? 'Ativa' : 'Encerrada', tone: ativa ? 'ok' : 'off' }}
                stats={[
                  { icon: FichaIcons.calendario, label: `Período ${t.periodo_letivo}` },
                  { icon: FichaIcons.turma, label: `${t.total_alunos} aluno(s)` },
                ]}
                actions={
                  <button
                    onClick={() => navigate(`/turmas/${t.id}`)}
                    className="text-xs font-bold hover:underline cursor-pointer text-[#3A2E00]"
                  >
                    Ver detalhes →
                  </button>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
