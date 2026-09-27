import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockEstudantes, mockCursos } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export function EstudantesForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;
  const existing = isEdit ? mockEstudantes.find(e => e.id === id) : null;

  const [nome, setNome] = useState(existing?.nome || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [telefone, setTelefone] = useState(existing?.telefone || '');
  const [cursoId, setCursoId] = useState(existing?.cursoId || '');
  const [senha, setSenha] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inativarModal, setInativarModal] = useState(false);
  const [inativando, setInativando] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Nome completo é obrigatório.';
    if (!email.trim()) e.email = 'E-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Informe um e-mail válido.';
    if (!cursoId) e.cursoId = 'Selecione um curso.';
    if (!isEdit && !senha) e.senha = 'Senha é obrigatória no cadastro.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast(isEdit ? 'Estudante atualizado com sucesso.' : 'Estudante cadastrado com sucesso.');
    navigate('/estudantes');
  };

  const handleInativar = async () => {
    setInativando(true);
    await new Promise(r => setTimeout(r, 1000));
    setInativando(false);
    setInativarModal(false);
    toast('Estudante inativado com sucesso.');
    navigate('/estudantes');
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={isEdit ? 'Editar estudante' : 'Novo estudante'}
        backTo="/estudantes"
        breadcrumbs={[{ label: 'Estudantes', href: '/estudantes' }, { label: isEdit ? 'Editar' : 'Novo' }]}
      />

      <form onSubmit={handleSave}>
        {/* Colunas lado a lado: dados pessoais | dados acadêmicos + acesso */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
          <section className="card-surface p-6">
            <h2 className="text-sm font-bold text-[#211C10] mb-4">Dados pessoais</h2>
            <div className="grid gap-4">
              <Input label="Nome completo" required value={nome} onChange={e => setNome(e.target.value)} error={errors.nome} placeholder="Nome completo do estudante" />
              <Input label="E-mail" type="email" required value={email} onChange={e => setEmail(e.target.value)} error={errors.email} placeholder="email@exemplo.com" />
              <Input label="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </section>

          <div className="flex flex-col gap-6">
            <section className="card-surface p-6">
              <h2 className="text-sm font-bold text-[#211C10] mb-4">Dados acadêmicos</h2>
              <Select label="Curso" required value={cursoId} onChange={e => setCursoId(e.target.value)} error={errors.cursoId}>
                <option value="">Selecione um curso</option>
                {mockCursos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </section>

            {!isEdit && (
              <section className="card-surface p-6">
                <h2 className="text-sm font-bold text-[#211C10] mb-4">Acesso</h2>
                <Input label="Senha" type="password" required value={senha} onChange={e => setSenha(e.target.value)} error={errors.senha} placeholder="Senha de acesso" hint="Mínimo de 8 caracteres." />
              </section>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>
            {isEdit ? 'Salvar alterações' : 'Cadastrar estudante'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/estudantes')}>Cancelar</Button>
          {isEdit && (
            <Button type="button" variant="destructive" className="ml-auto" onClick={() => setInativarModal(true)}>
              Inativar estudante
            </Button>
          )}
        </div>
      </form>

      <Modal open={inativarModal} onClose={() => setInativarModal(false)} title="Inativar estudante?">
        <p className="text-sm text-[#5B5645] mb-6">
          O estudante <strong>{existing?.nome}</strong> não poderá fazer login nem ser matriculado em novas turmas, mas seus registros acadêmicos permanecerão disponíveis para consulta.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setInativarModal(false)}>Cancelar</Button>
          <Button variant="destructive" loading={inativando} onClick={handleInativar}>Inativar estudante</Button>
        </div>
      </Modal>
    </div>
  );
}
