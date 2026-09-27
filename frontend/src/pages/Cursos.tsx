import { useState } from 'react';
import { mockCursos } from '../data/mockData';
import type { Curso } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Ficha, FichaIcons, FichaWatermarks } from '../components/ui/Ficha';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export function Cursos() {
  const { toast } = useToast();
  const [cursos, setCursos] = useState<Curso[]>(mockCursos);
  const [createModal, setCreateModal] = useState(false);
  const [nome, setNome] = useState('');
  const [nomeError, setNomeError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { setNomeError('Nome do curso é obrigatório.'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setCursos(prev => [...prev, { id: `c${Date.now()}`, nome: nome.trim(), totalDisciplinas: 0 }]);
    setSaving(false);
    setCreateModal(false);
    setNome('');
    setNomeError('');
    toast('Curso criado com sucesso.');
  };

  return (
    <div>
      <PageHeader
        title="Cursos"
        description="Gerencie os cursos disponíveis na instituição."
        action={<Button onClick={() => setCreateModal(true)}>+ Novo curso</Button>}
      />

      {cursos.length === 0 ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm">Nenhum curso cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cursos.map(c => (
            <Ficha
              key={c.id}
              eyebrow="Curso"
              title={c.nome}
              watermark={FichaWatermarks.livro}
              stats={[
                { icon: FichaIcons.curso, label: `${c.totalDisciplinas} disciplina${c.totalDisciplinas !== 1 ? 's' : ''}` },
              ]}
            />
          ))}
        </div>
      )}

      <Modal open={createModal} onClose={() => { setCreateModal(false); setNome(''); setNomeError(''); }} title="Novo curso">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nome do curso"
            required
            value={nome}
            onChange={e => { setNome(e.target.value); setNomeError(''); }}
            error={nomeError}
            placeholder="Ex: Sistemas de Informação"
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => { setCreateModal(false); setNome(''); }}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar curso</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
