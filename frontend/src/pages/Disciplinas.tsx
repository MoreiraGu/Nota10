import { useState } from 'react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Ficha, FichaIcons, FichaWatermarks } from '../components/ui/Ficha';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Carregando, Erro, Vazio } from '../components/ui/Estado';

export function Disciplinas() {
  const { toast } = useToast();
  const disciplinas = useApi(() => api.getDisciplinas());
  const cursos = useApi(() => api.getCursos());
  const listaCursos = cursos.data ?? [];

  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fecharModal = () => {
    setModalAberto(false);
    setNome('');
    setCursoId('');
    setFormErrors({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!nome.trim()) errs.nome = 'Nome é obrigatório.';
    if (!cursoId) errs.cursoId = 'Selecione um curso.';
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }

    setSaving(true);
    try {
      await api.createDisciplina({ nome: nome.trim(), curso_id: Number(cursoId) });
      toast('Disciplina criada com sucesso.');
      fecharModal();
      disciplinas.recarregar();
    } catch (err: any) {
      toast(err?.message || 'Erro ao criar disciplina.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Disciplinas"
        description="Gerencie as disciplinas dos cursos."
        action={<Button onClick={() => setModalAberto(true)}>+ Nova disciplina</Button>}
      />

      {disciplinas.error && <Erro texto={disciplinas.error} onTentarNovamente={disciplinas.recarregar} />}

      {disciplinas.loading ? (
        <Carregando texto="Carregando disciplinas..." />
      ) : !disciplinas.data || disciplinas.data.length === 0 ? (
        <Vazio texto="Nenhuma disciplina cadastrada." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {disciplinas.data.map(d => {
            const ativa = d.situacao === 'ATIVA';
            return (
              <Ficha
                key={d.id}
                eyebrow={d.curso}
                title={d.nome}
                muted={!ativa}
                watermark={FichaWatermarks.livro}
                status={{ label: ativa ? 'Ativa' : 'Inativa', tone: ativa ? 'ok' : 'off' }}
                stats={[{ icon: FichaIcons.curso, label: d.curso }]}
              />
            );
          })}
        </div>
      )}

      <Modal open={modalAberto} onClose={fecharModal} title="Nova disciplina">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nome"
            required
            value={nome}
            onChange={e => { setNome(e.target.value); setFormErrors(prev => ({ ...prev, nome: '' })); }}
            error={formErrors.nome}
            placeholder="Ex: Programação Web"
          />
          <Select
            label="Curso"
            required
            value={cursoId}
            onChange={e => { setCursoId(e.target.value); setFormErrors(prev => ({ ...prev, cursoId: '' })); }}
            error={formErrors.cursoId}
          >
            <option value="">Selecione um curso</option>
            {listaCursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
          {listaCursos.length === 0 && (
            <p className="text-xs text-[#8A6D00]">Cadastre um curso antes de criar uma disciplina.</p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={fecharModal}>Cancelar</Button>
            <Button type="submit" loading={saving} disabled={listaCursos.length === 0}>Criar disciplina</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
