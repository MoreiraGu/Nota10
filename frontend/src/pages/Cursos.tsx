import { useState } from 'react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Ficha, FichaWatermarks } from '../components/ui/Ficha';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Carregando, Erro, Vazio } from '../components/ui/Estado';

export function Cursos() {
  const { toast } = useToast();
  const { data: cursos, loading, error, recarregar } = useApi(() => api.getCursos());

  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [nomeError, setNomeError] = useState('');
  const [saving, setSaving] = useState(false);

  const fecharModal = () => {
    setModalAberto(false);
    setNome('');
    setNomeError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setNomeError('Nome do curso é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      await api.createCurso({ nome: nome.trim() });
      toast('Curso criado com sucesso.');
      fecharModal();
      recarregar();
    } catch (err: any) {
      toast(err?.message || 'Erro ao criar curso.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Cursos"
        description="Gerencie os cursos disponíveis na instituição."
        action={<Button onClick={() => setModalAberto(true)}>+ Novo curso</Button>}
      />

      {error && <Erro texto={error} onTentarNovamente={recarregar} />}

      {loading ? (
        <Carregando texto="Carregando cursos..." />
      ) : !cursos || cursos.length === 0 ? (
        <Vazio texto="Nenhum curso cadastrado." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cursos.map(curso => (
            <Ficha
              key={curso.id}
              eyebrow="Curso"
              title={curso.nome}
              watermark={FichaWatermarks.livro}
              stats={[]}
            />
          ))}
        </div>
      )}

      <Modal open={modalAberto} onClose={fecharModal} title="Novo curso">
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
            <Button type="button" variant="secondary" onClick={fecharModal}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar curso</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
