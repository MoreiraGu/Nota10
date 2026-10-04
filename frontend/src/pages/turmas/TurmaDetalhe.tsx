import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError, api } from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import { Timeline, TimelineItem } from '../../components/ui/Timeline';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

interface TurmaDetalheData {
  id: number;
  disciplina_id: number;
  periodo_letivo: string;
  situacao: string;
  professores: Array<{ id: number; nome: string }>;
  alunos: Array<{ id: number; nome: string }>;
}

const iconProf = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.42A12.083 12.083 0 0112 20.055 12.083 12.083 0 015.84 10.58L12 14z" />
  </svg>
);
const iconAluno = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="3.2" />
    <path strokeLinecap="round" d="M5.5 19c0-3.6 2.9-5.8 6.5-5.8s6.5 2.2 6.5 5.8" />
  </svg>
);

export function TurmaDetalhe() {
  const { id } = useParams();
  const { toast } = useToast();

  const [turma, setTurma] = useState<TurmaDetalheData | null>(null);
  const [disciplinaNome, setDisciplinaNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('professores');

  // Vincular professor
  const [allProfessores, setAllProfessores] = useState<Array<{ id: number; nome: string; situacao: string }>>([]);
  const [vincularModal, setVincularModal] = useState(false);
  const [selectedProf, setSelectedProf] = useState('');
  const [profError, setProfError] = useState('');
  const [vinculando, setVinculando] = useState(false);

  // Matricular aluno
  const [allEstudantes, setAllEstudantes] = useState<Array<{ id: number; nome: string; situacao: string }>>([]);
  const [matricularModal, setMatricularModal] = useState(false);
  const [selectedAluno, setSelectedAluno] = useState('');
  const [alunoError, setAlunoError] = useState('');
  const [matriculando, setMatriculando] = useState(false);

  async function carregarTurma() {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getTurma(id);
      setTurma(data);

      // Carrega nome da disciplina
      const disciplinas = await api.getDisciplinas();
      const disc = disciplinas.find(d => d.id === data.disciplina_id);
      setDisciplinaNome(disc?.nome ?? `Disciplina #${data.disciplina_id}`);
    } catch (e) {
      if (e instanceof ApiError) toast(e.message, 'error');
      else toast('Não foi possível carregar a turma.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTurma();
  }, [id, toast]);

  useEffect(() => {
    async function carregarListas() {
      try {
        const [profs, estudantes] = await Promise.all([
          api.getProfessores(),
          api.getEstudantes(),
        ]);
        setAllProfessores(profs.map(p => ({ id: p.id, nome: p.nome, situacao: p.situacao })));
        setAllEstudantes(estudantes.map(e => ({ id: e.id, nome: e.nome, situacao: e.situacao })));
      } catch { /* silencioso */ }
    }
    carregarListas();
  }, []);

  const handleVincularProf = async () => {
    if (!selectedProf) { setProfError('Selecione um professor.'); return; }
    setVinculando(true);
    try {
      await api.vincularProfessor(id!, Number(selectedProf));
      await carregarTurma();
      setVincularModal(false);
      setSelectedProf(''); setProfError('');
      toast('Professor vinculado com sucesso.');
    } catch (e) {
      if (e instanceof ApiError) setProfError(e.message);
      else setProfError('Erro ao vincular professor.');
    } finally {
      setVinculando(false);
    }
  };

  const handleMatricular = async () => {
    if (!selectedAluno) { setAlunoError('Selecione um estudante.'); return; }
    setMatriculando(true);
    try {
      await api.matricularAluno(id!, Number(selectedAluno));
      await carregarTurma();
      setMatricularModal(false);
      setSelectedAluno(''); setAlunoError('');
      toast('Aluno matriculado com sucesso.');
    } catch (e) {
      if (e instanceof ApiError) setAlunoError(e.message);
      else setAlunoError('Erro ao matricular aluno.');
    } finally {
      setMatriculando(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-sm text-[#948F7C]">Carregando turma...</div>;
  }

  if (!turma) {
    return <div className="text-center py-20 text-sm text-[#948F7C]">Turma não encontrada.</div>;
  }

  const profDisponiveis = allProfessores.filter(p => !turma.professores.some(v => v.id === p.id));
  const alunosDisponiveis = allEstudantes.filter(e => !turma.alunos.some(a => a.id === e.id));

  return (
    <div>
      <PageHeader
        backTo="/turmas"
        title={disciplinaNome}
        breadcrumbs={[{ label: 'Turmas', href: '/turmas' }, { label: disciplinaNome }]}
        description={`Período letivo ${turma.periodo_letivo}`}
        action={<Badge variant={turma.situacao === 'ATIVA' ? 'ativa' : 'encerrada'}>{turma.situacao === 'ATIVA' ? 'Ativa' : 'Encerrada'}</Badge>}
      />

      <Tabs
        tabs={[
          { id: 'professores', label: 'Professores vinculados', count: turma.professores.length },
          { id: 'alunos', label: 'Alunos matriculados', count: turma.alunos.length },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <TabPanel active={activeTab} id="professores">
        <div className="flex justify-end mb-5">
          <Button onClick={() => setVincularModal(true)}>+ Vincular professor</Button>
        </div>
        {turma.professores.length === 0 ? (
          <div className="card-surface-plain flex items-center justify-center py-14 text-[#948F7C] text-sm">
            Nenhum professor vinculado a esta turma.
          </div>
        ) : (
          <Timeline>
            {turma.professores.map((p, i) => (
              <TimelineItem
                key={p.id}
                icon={iconProf}
                title={p.nome}
                meta="Professor"
                tone="ok"
                isLast={i === turma.professores.length - 1}
              >
                <span className="text-xs text-[#5B5645]">ID #{p.id}</span>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </TabPanel>

      <TabPanel active={activeTab} id="alunos">
        <div className="flex justify-end mb-5">
          <Button onClick={() => setMatricularModal(true)}>+ Matricular aluno</Button>
        </div>
        {turma.alunos.length === 0 ? (
          <div className="card-surface-plain flex items-center justify-center py-14 text-[#948F7C] text-sm">
            Nenhum aluno matriculado nesta turma.
          </div>
        ) : (
          <Timeline>
            {turma.alunos.map((a, i) => (
              <TimelineItem
                key={a.id}
                icon={iconAluno}
                title={a.nome}
                meta="Aluno matriculado"
                tone="neutral"
                isLast={i === turma.alunos.length - 1}
              >
                <span className="text-xs text-[#5B5645]">ID #{a.id}</span>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </TabPanel>

      {/* Vincular professor */}
      <Modal
        open={vincularModal}
        onClose={() => { setVincularModal(false); setSelectedProf(''); setProfError(''); }}
        title="Vincular professor"
      >
        <div className="space-y-4">
          <Select
            label="Professor"
            required
            value={selectedProf}
            onChange={e => { setSelectedProf(e.target.value); setProfError(''); }}
            error={profError}
          >
            <option value="">Selecione um professor</option>
            {profDisponiveis.map(p => (
              <option key={p.id} value={p.id}>
                {p.nome}{p.situacao === 'INATIVO' ? ' (inativo)' : ''}
              </option>
            ))}
          </Select>
          {profDisponiveis.length === 0 && (
            <p className="text-xs text-[#948F7C]">Todos os professores já estão vinculados a esta turma.</p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setVincularModal(false)}>Cancelar</Button>
            <Button loading={vinculando} onClick={handleVincularProf} disabled={profDisponiveis.length === 0}>
              Vincular professor
            </Button>
          </div>
        </div>
      </Modal>

      {/* Matricular aluno */}
      <Modal
        open={matricularModal}
        onClose={() => { setMatricularModal(false); setSelectedAluno(''); setAlunoError(''); }}
        title="Matricular aluno"
      >
        <div className="space-y-4">
          <Select
            label="Estudante"
            required
            value={selectedAluno}
            onChange={e => { setSelectedAluno(e.target.value); setAlunoError(''); }}
            error={alunoError}
          >
            <option value="">Selecione um estudante</option>
            {alunosDisponiveis.map(e => (
              <option key={e.id} value={e.id}>
                {e.nome}{e.situacao === 'INATIVO' ? ' (inativo)' : ''}
              </option>
            ))}
          </Select>
          {alunosDisponiveis.length === 0 && (
            <p className="text-xs text-[#948F7C]">Todos os estudantes já estão matriculados nesta turma.</p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setMatricularModal(false)}>Cancelar</Button>
            <Button loading={matriculando} onClick={handleMatricular} disabled={alunosDisponiveis.length === 0}>
              Matricular aluno
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
