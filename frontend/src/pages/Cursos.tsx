import { useEffect, useState } from 'react';
import type { Curso } from '../types';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Ficha, FichaWatermarks } from '../components/ui/Ficha';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export function Cursos() {
  const { toast } = useToast();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [nome, setNome] = useState('');
  const [nomeError, setNomeError] = useState('');
  const [saving, setSaving] = useState(false);

  const carregarCursos = async () => {
    setLoading(true);
    setError(null);
    try {
      const cursosData = await api.getCursos();
      setCursos(
        cursosData.map(curso => ({
          id: String(curso.id),
          nome: curso.nome,
          totalDisciplinas: 0,
        }))
      );
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar os cursos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCursos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setNomeError('Nome do curso é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const criado = await api.createCurso({ nome: nome.trim() });
      setCursos(prev => [...prev, {
        id: String(criado.id),
        nome: criado.nome,
        totalDisciplinas: 0,
      }].sort((a, b) => a.nome.localeCompare(b.nome)));
      setCreateModal(false);
      setNome('');
      setNomeError('');
      toast('Curso criado com sucesso.');
    } catch (err: any) {
      toast(err?.message || 'Erro ao criar curso.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setCreateModal(false);
    setNome('');
    setNomeError('');
  };

  return (
    <div>
      <PageHeader
        title="Cursos"
        description="Gerencie os cursos disponíveis na instituição."
        action={<Button onClick={() => setCreateModal(true)}>+ Novo curso</Button>}
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between gap-4">
          <span>{error}</span>
          <button onClick={carregarCursos} className="font-semibold underline cursor-pointer shrink-0">
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm font-semibold">Carregando cursos...</p>
        </div>
      ) : cursos.length === 0 ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C] gap-3">
          <p className="text-sm">Nenhum curso cadastrado.</p>
          {!error && <Button size="sm" onClick={() => setCreateModal(true)}>Cadastrar o primeiro curso</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cursos.map(c => (
            <Ficha
              key={c.id}
              eyebrow="Curso"
              title={c.nome}
              watermark={FichaWatermarks.livro}
              stats={[]}
            />
          ))}
        </div>
      )}

      <Modal open={createModal} onClose={closeModal} title="Novo curso">
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
            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar curso</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
