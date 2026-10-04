import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, api } from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

export function TurmasCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [disciplinas, setDisciplinas] = useState<Array<{ id: number; nome: string; situacao: string }>>([]);
  const [disciplinaId, setDisciplinaId] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingDisciplinas, setLoadingDisciplinas] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const data = await api.getDisciplinas();
        setDisciplinas(data.filter(d => d.situacao === 'ATIVA'));
      } catch (e) {
        if (e instanceof ApiError) toast(e.message, 'error');
        else toast('Não foi possível carregar as disciplinas.', 'error');
      } finally {
        setLoadingDisciplinas(false);
      }
    }
    carregar();
  }, [toast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!disciplinaId) errs.disciplinaId = 'Selecione uma disciplina.';
    if (!periodo.trim()) errs.periodo = 'Período letivo é obrigatório.';
    if (!/^\d{4}\.\d$/.test(periodo.trim())) errs.periodo = 'Formato inválido. Use AAAA.S (ex: 2026.2).';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const turma = await api.createTurma({
        disciplina_id: Number(disciplinaId),
        periodo_letivo: periodo.trim(),
      });
      toast('Turma criada com sucesso!');
      navigate(`/turmas/${turma.id}`);
    } catch (e) {
      if (e instanceof ApiError) toast(e.message, 'error');
      else toast('Erro ao criar turma.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Nova turma"
        backTo="/turmas"
        breadcrumbs={[{ label: 'Turmas', href: '/turmas' }, { label: 'Nova turma' }]}
      />

      <form onSubmit={handleCreate} className="space-y-6">
        <section className="card-surface p-6">
          <h2 className="text-sm font-bold text-[#211C10] mb-4">Dados da turma</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Disciplina"
              required
              value={disciplinaId}
              onChange={e => { setDisciplinaId(e.target.value); setErrors(prev => ({ ...prev, disciplinaId: '' })); }}
              error={errors.disciplinaId}
            >
              <option value="">{loadingDisciplinas ? 'Carregando...' : 'Selecione uma disciplina'}</option>
              {disciplinas.map(d => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </Select>
            <Input
              label="Período letivo"
              required
              value={periodo}
              onChange={e => { setPeriodo(e.target.value); setErrors(prev => ({ ...prev, periodo: '' })); }}
              error={errors.periodo}
              placeholder="Ex: 2026.2"
              hint="Formato: AAAA.S (ex: 2026.2)"
            />
          </div>
        </section>

        <div className="flex gap-3">
          <Button type="submit" loading={saving} disabled={loadingDisciplinas}>Criar turma</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/turmas')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
