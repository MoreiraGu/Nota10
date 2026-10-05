import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, api } from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Ficha, FichaIcons, FichaWatermarks } from '../../components/ui/Ficha';
import { useToast } from '../../components/ui/Toast';

interface TurmaItem {
  id: number;
  disciplina_id: number;
  periodo_letivo: string;
  situacao: string;
}

export function TurmasList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [turmas, setTurmas] = useState<TurmaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('');
  const [disciplinasMap, setDisciplinasMap] = useState<Record<number, string>>({});

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        
        const [disciplinasData, turmasData] = await Promise.all([
        api.getDisciplinas(),
        api.getTurmas(),
      ]);

      const mapa: Record<number, string> = {};

      disciplinasData.forEach(d => {
        mapa[d.id] = d.nome;
      });

      setDisciplinasMap(mapa);
      setTurmas(turmasData);
      } catch (e) {
        if (e instanceof ApiError) toast(e.message, 'error');
        else toast('Não foi possível carregar as turmas.', 'error');
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [toast]);

  const periodos = Array.from(new Set(turmas.map(t => t.periodo_letivo))).sort().reverse();
  const filtered = turmas.filter(t => !periodo || t.periodo_letivo === periodo);

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
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <span className="text-xs font-semibold text-[#948F7C] ml-auto">
          {filtered.length} turma{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="card-surface-plain flex items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm font-medium">Carregando turmas...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C] gap-3">
          <p className="text-sm">Nenhuma turma encontrada.</p>
          <Button size="sm" onClick={() => navigate('/turmas/novo')}>Criar primeira turma</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(t => (
            <Ficha
              key={t.id}
              eyebrow={t.periodo_letivo}
              title={disciplinasMap[t.disciplina_id] || `Disciplina #${t.disciplina_id}`}
              muted={t.situacao !== 'ATIVA'}
              watermark={FichaWatermarks.turma}
              status={{ label: t.situacao === 'ATIVA' ? 'Ativa' : 'Encerrada', tone: t.situacao === 'ATIVA' ? 'ok' : 'off' }}
              stats={[
                { icon: FichaIcons.calendario, label: `Período ${t.periodo_letivo}` },
              ]}
              actions={
                <button
                  onClick={() => navigate(`/turmas/${t.id}`)}
                  className="text-xs font-bold hover:underline cursor-pointer"
                  style={{ color: '#3A2E00' }}
                >
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
