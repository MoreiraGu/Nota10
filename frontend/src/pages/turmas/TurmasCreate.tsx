import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockDisciplinas } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

export function TurmasCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [disciplinaId, setDisciplinaId] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!disciplinaId) errs.disciplinaId = 'Selecione uma disciplina.';
    if (!periodo.trim()) errs.periodo = 'Período letivo é obrigatório.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    toast('Turma criada com sucesso. Redirecionando...');
    await new Promise(r => setTimeout(r, 800));
    navigate('/turmas/t1'); // redirect to detail
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
              <option value="">Selecione uma disciplina</option>
              {mockDisciplinas.filter(d => d.situacao === 'ativa').map(d => (
                <option key={d.id} value={d.id}>{d.nome} — {d.curso}</option>
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
          <Button type="submit" loading={saving}>Criar turma</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/turmas')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
