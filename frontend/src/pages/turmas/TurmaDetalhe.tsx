import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { mockTurmas, mockProfessores, mockEstudantes } from '../../data/mockData';
import type { ProfessorVinculo, AlunoMatricula } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import { Timeline, TimelineItem } from '../../components/ui/Timeline';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

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
  const turma = mockTurmas.find(t => t.id === id);
  const [activeTab, setActiveTab] = useState('professores');

  const [professores, setProfessores] = useState<ProfessorVinculo[]>(turma?.professoresVinculados || []);
  const [alunos, setAlunos] = useState<AlunoMatricula[]>(turma?.alunosMatriculados || []);

  const [vincularModal, setVincularModal] = useState(false);
  const [selectedProf, setSelectedProf] = useState('');
  const [profError, setProfError] = useState('');
  const [vinculando, setVinculando] = useState(false);

  const [matricularModal, setMatricularModal] = useState(false);
  const [selectedAluno, setSelectedAluno] = useState('');
  const [alunoError, setAlunoError] = useState('');
  const [matriculando, setMatriculando] = useState(false);

  const [desvinculaModal, setDesvinculaModal] = useState<ProfessorVinculo | null>(null);

  if (!turma) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#948F7C]">
        <p className="text-sm">Turma não encontrada.</p>
      </div>
    );
  }

  const profDisponiveis = mockProfessores.filter(p => !professores.some(v => v.professorId === p.id));
  const alunosDisponiveis = mockEstudantes.filter(e => !alunos.some(a => a.estudanteId === e.id));

  const handleVincularProf = async () => {
    if (!selectedProf) { setProfError('Selecione um professor.'); return; }
    const prof = mockProfessores.find(p => p.id === selectedProf)!;
    if (prof.situacao === 'inativo') {
      setProfError('Não é possível vincular este professor porque ele está inativo.');
      return;
    }
    setVinculando(true);
    await new Promise(r => setTimeout(r, 800));
    setProfessores(prev => [...prev, { professorId: prof.id, nome: prof.nome, email: prof.email, situacao: prof.situacao }]);
    setVinculando(false);
    setVincularModal(false);
    setSelectedProf(''); setProfError('');
    toast('Professor vinculado com sucesso.');
  };

  const handleDesvincular = async (v: ProfessorVinculo) => {
    await new Promise(r => setTimeout(r, 500));
    setProfessores(prev => prev.filter(p => p.professorId !== v.professorId));
    setDesvinculaModal(null);
    toast('Professor desvinculado.');
  };

  const handleMatricular = async () => {
    if (!selectedAluno) { setAlunoError('Selecione um estudante.'); return; }
    const est = mockEstudantes.find(e => e.id === selectedAluno)!;
    if (est.situacao === 'inativo') {
      setAlunoError('Não é possível matricular este aluno porque ele está inativo.');
      return;
    }
    if (alunos.some(a => a.estudanteId === est.id)) {
      setAlunoError('Este aluno já está matriculado nesta turma.');
      return;
    }
    setMatriculando(true);
    await new Promise(r => setTimeout(r, 800));
    setAlunos(prev => [...prev, {
      estudanteId: est.id,
      nome: est.nome,
      email: est.email,
      curso: est.curso,
      dataMatricula: new Date().toISOString().split('T')[0],
    }]);
    setMatriculando(false);
    setMatricularModal(false);
    setSelectedAluno(''); setAlunoError('');
    toast('Aluno matriculado com sucesso.');
  };

  return (
    <div>
      <PageHeader
        backTo="/turmas"
        title={turma.disciplina}
        breadcrumbs={[{ label: 'Turmas', href: '/turmas' }, { label: turma.disciplina }]}
        description={`Período letivo ${turma.periodoLetivo}`}
        action={<Badge variant={turma.situacao}>{turma.situacao === 'ativa' ? 'Ativa' : 'Encerrada'}</Badge>}
      />

      <Tabs
        tabs={[
          { id: 'professores', label: 'Professores vinculados', count: professores.length },
          { id: 'alunos', label: 'Alunos matriculados', count: alunos.length },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <TabPanel active={activeTab} id="professores">
        <div className="flex justify-end mb-5">
          <Button onClick={() => setVincularModal(true)}>+ Vincular professor</Button>
        </div>
        {professores.length === 0 ? (
          <div className="card-surface-plain flex items-center justify-center py-14 text-[#948F7C] text-sm">
            Nenhum professor vinculado a esta turma.
          </div>
        ) : (
          <Timeline>
            {professores.map((p, i) => (
              <TimelineItem
                key={p.professorId}
                icon={iconProf}
                title={p.nome}
                meta={p.situacao === 'ativo' ? 'Ativo' : 'Inativo'}
                tone={p.situacao === 'ativo' ? 'ok' : 'off'}
                isLast={i === professores.length - 1}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-[#5B5645]">{p.email}</span>
                  <button onClick={() => setDesvinculaModal(p)} className="text-xs text-red-700 hover:underline cursor-pointer font-semibold shrink-0">
                    Desvincular
                  </button>
                </div>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </TabPanel>

      <TabPanel active={activeTab} id="alunos">
        <div className="flex justify-end mb-5">
          <Button onClick={() => setMatricularModal(true)}>+ Matricular aluno</Button>
        </div>
        {alunos.length === 0 ? (
          <div className="card-surface-plain flex items-center justify-center py-14 text-[#948F7C] text-sm">
            Nenhum aluno matriculado nesta turma.
          </div>
        ) : (
          <Timeline>
            {[...alunos]
              .sort((a, b) => a.dataMatricula.localeCompare(b.dataMatricula))
              .map((a, i, arr) => (
                <TimelineItem
                  key={a.estudanteId}
                  icon={iconAluno}
                  title={a.nome}
                  meta={`Matriculado em ${a.dataMatricula}`}
                  tone="neutral"
                  isLast={i === arr.length - 1}
                >
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5B5645]">
                    <span>{a.email}</span>
                    <span>·</span>
                    <span>{a.curso}</span>
                  </div>
                </TimelineItem>
              ))}
          </Timeline>
        )}
      </TabPanel>

      {/* Vincular professor */}
      <Modal open={vincularModal} onClose={() => { setVincularModal(false); setSelectedProf(''); setProfError(''); }} title="Vincular professor">
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
              <option key={p.id} value={p.id}>{p.nome}{p.situacao === 'inativo' ? ' (inativo)' : ''}</option>
            ))}
          </Select>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setVincularModal(false)}>Cancelar</Button>
            <Button loading={vinculando} onClick={handleVincularProf}>Vincular professor</Button>
          </div>
        </div>
      </Modal>

      {/* Desvincular professor */}
      <Modal open={!!desvinculaModal} onClose={() => setDesvinculaModal(null)} title="Desvincular professor?">
        <p className="text-sm text-[#5B5645] mb-6">
          Deseja desvincular <strong>{desvinculaModal?.nome}</strong> desta turma?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDesvinculaModal(null)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => desvinculaModal && handleDesvincular(desvinculaModal)}>Desvincular</Button>
        </div>
      </Modal>

      {/* Matricular aluno */}
      <Modal open={matricularModal} onClose={() => { setMatricularModal(false); setSelectedAluno(''); setAlunoError(''); }} title="Matricular aluno">
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
              <option key={e.id} value={e.id}>{e.nome}{e.situacao === 'inativo' ? ' (inativo)' : ''}</option>
            ))}
          </Select>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setMatricularModal(false)}>Cancelar</Button>
            <Button loading={matriculando} onClick={handleMatricular}>Matricular aluno</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
