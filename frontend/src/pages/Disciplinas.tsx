import { useEffect, useState } from 'react';
import type { Disciplina } from '../types';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Ficha, FichaIcons, FichaWatermarks } from '../components/ui/Ficha';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

interface CursoOption {
  id: number;
  nome: string;
}

export function Disciplinas() {
  const { toast } = useToast();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [cursos, setCursos] = useState<CursoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [nome, setNome] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [disciplinasData, cursosData] = await Promise.all([
        api.getDisciplinas(),
        api.getCursos(),
      ]);

      setCursos(cursosData);
      setDisciplinas(
        disciplinasData.map(item => ({
          id: String(item.id),
          nome: item.nome,
          cursoId: String(item.curso_id),
          curso: item.curso,
          situacao: item.situacao === 'ATIVA' ? 'ativa' : 'inativa',
          temTurmaAtiva: false,
          temNotas: false,
        }))
      );
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar as disciplinas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

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
      const criada = await api.createDisciplina({
        nome: nome.trim(),
        curso_id: Number(cursoId),
      });

      const nova: Disciplina = {
        id: String(criada.id),
        nome: criada.nome,
        cursoId: String(criada.curso_id),
        curso: criada.curso,
        situacao: criada.situacao === 'ATIVA' ? 'ativa' : 'inativa',
        temTurmaAtiva: false,
        temNotas: false,
      };

      setDisciplinas(prev => [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome)));
      setCreateModal(false);
      setNome('');
      setCursoId('');
      setFormErrors({});
      toast('Disciplina criada com sucesso.');
    } catch (err: any) {
      toast(err?.message || 'Erro ao criar disciplina.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setCreateModal(false);
    setNome('');
    setCursoId('');
    setFormErrors({});
  };

  return (
    <div>
      <PageHeader
        title="Disciplinas"
        description="Gerencie as disciplinas dos cursos."
        action={<Button onClick={() => setCreateModal(true)}>+ Nova disciplina</Button>}
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between gap-4">
          <span>{error}</span>
          <button onClick={carregarDados} className="font-semibold underline cursor-pointer shrink-0">
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm font-semibold">Carregando disciplinas...</p>
        </div>
      ) : disciplinas.length === 0 ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C] gap-3">
          <p className="text-sm">Nenhuma disciplina cadastrada.</p>
          {!error && cursos.length > 0 && (
            <Button size="sm" onClick={() => setCreateModal(true)}>Cadastrar a primeira disciplina</Button>
          )}
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
              ]}
            />
          ))}
        </div>
      )}

      <Modal open={createModal} onClose={closeModal} title="Nova disciplina">
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
            {cursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
          {cursos.length === 0 && (
            <p className="text-xs text-[#8A6D00]">Cadastre um curso antes de criar uma disciplina.</p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={saving} disabled={cursos.length === 0}>Criar disciplina</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
