import { useState } from 'react';
import { mockDisciplinas, mockCursos } from '../data/mockData';
import type { Disciplina } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Ficha, FichaIcons, FichaWatermarks } from '../components/ui/Ficha';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export function Disciplinas() {
  const { toast } = useToast();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>(mockDisciplinas);
  const [createModal, setCreateModal] = useState(false);
  const [nome, setNome] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!nome.trim()) errs.nome = 'Nome é obrigatório.';
    if (!cursoId) errs.cursoId = 'Selecione um curso.';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    const curso = mockCursos.find(c => c.id === cursoId)!;
    setDisciplinas(prev => [...prev, {
      id: `d${Date.now()}`,
      nome: nome.trim(),
      cursoId,
      curso: curso.nome,
      situacao: 'ativa',
      temTurmaAtiva: false,
      temNotas: false,
    }]);
    setSaving(false);
    setCreateModal(false);
    setNome(''); setCursoId(''); setFormErrors({});
    toast('Disciplina criada com sucesso.');
  };

  const handleInativar = async (d: Disciplina) => {
    await new Promise(r => setTimeout(r, 500));
    setDisciplinas(prev => prev.map(x => x.id === d.id ? { ...x, situacao: 'inativa' } : x));
    toast('Disciplina inativada.');
  };

  const canDelete = (d: Disciplina) => !d.temTurmaAtiva && !d.temNotas;

  const handleDelete = async (d: Disciplina) => {
    if (!canDelete(d)) return;
    setDisciplinas(prev => prev.filter(x => x.id !== d.id));
    toast('Disciplina excluída.');
  };

  return (
    <div>
      <PageHeader
        title="Disciplinas"
        description="Gerencie as disciplinas dos cursos."
        action={<Button onClick={() => setCreateModal(true)}>+ Nova disciplina</Button>}
      />

      {disciplinas.length === 0 ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm">Nenhuma disciplina cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {disciplinas.map(d => (
            <Ficha
              key={d.id}
              eyebrow={d.curso}
              title={d.nome}
              muted={d.situacao !== 'ativa'}
              watermark={FichaWatermarks.livro}
              status={{ label: d.situacao === 'ativa' ? 'Ativa' : 'Inativa', tone: d.situacao === 'ativa' ? 'ok' : 'off' }}
              stats={[
                { icon: FichaIcons.curso, label: d.curso },
                { icon: FichaIcons.turma, label: d.temTurmaAtiva ? 'Possui turma ativa' : 'Sem turma ativa' },
              ]}
              actions={
                <>
                  {d.situacao === 'ativa' && (
                    <button onClick={() => handleInativar(d)} className="text-xs font-semibold hover:underline cursor-pointer" style={{ color: '#8A6D00' }}>
                      Inativar
                    </button>
                  )}
                  <div className="relative group ml-auto">
                    <button
                      onClick={() => handleDelete(d)}
                      disabled={!canDelete(d)}
                      className={`text-xs font-semibold cursor-pointer ${canDelete(d) ? 'text-red-700 hover:underline' : 'text-[#A99A55] cursor-not-allowed'}`}
                    >
                      Excluir
                    </button>
                    {!canDelete(d) && (
                      <div className="hidden group-hover:block absolute right-0 bottom-6 w-56 bg-[#211C10] text-white text-xs px-3 py-2 rounded-[8px] shadow-lg z-10 leading-relaxed">
                        Não é possível excluir: possui turma ativa ou notas lançadas.
                      </div>
                    )}
                  </div>
                </>
              }
            />
          ))}
        </div>
      )}

      <Modal open={createModal} onClose={() => { setCreateModal(false); setNome(''); setCursoId(''); setFormErrors({}); }} title="Nova disciplina">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nome" required value={nome} onChange={e => { setNome(e.target.value); setFormErrors(prev => ({ ...prev, nome: '' })); }} error={formErrors.nome} placeholder="Ex: Programação Web" />
          <Select label="Curso" required value={cursoId} onChange={e => { setCursoId(e.target.value); setFormErrors(prev => ({ ...prev, cursoId: '' })); }} error={formErrors.cursoId}>
            <option value="">Selecione um curso</option>
            {mockCursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateModal(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar disciplina</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
