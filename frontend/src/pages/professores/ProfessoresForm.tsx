import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockProfessores } from '../../data/mockData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export function ProfessoresForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;
  const existing = isEdit ? mockProfessores.find(p => p.id === id) : null;

  const [nome, setNome] = useState(existing?.nome || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [telefone, setTelefone] = useState(existing?.telefone || '');
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
    toast(isEdit ? 'Professor atualizado com sucesso.' : 'Professor cadastrado com sucesso.');
    navigate('/professores');
  };

  const handleInativar = async () => {
    setInativando(true);
    await new Promise(r => setTimeout(r, 1000));
    setInativando(false);
    setInativarModal(false);
    toast('Professor inativado com sucesso.');
    navigate('/professores');
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={isEdit ? 'Editar professor' : 'Novo professor'}
        backTo="/professores"
        breadcrumbs={[{ label: 'Professores', href: '/professores' }, { label: isEdit ? 'Editar' : 'Novo' }]}
      />

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
          <section className="card-surface p-6">
            <h2 className="text-sm font-bold text-[#211C10] mb-4">Dados do professor</h2>
            <div className="grid gap-4">
              <Input label="Nome completo" required value={nome} onChange={e => setNome(e.target.value)} error={errors.nome} placeholder="Nome completo do professor" />
              <Input label="E-mail" type="email" required value={email} onChange={e => setEmail(e.target.value)} error={errors.email} placeholder="email@exemplo.com" />
              <Input label="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </section>

          {!isEdit && (
            <section className="card-surface p-6">
              <h2 className="text-sm font-bold text-[#211C10] mb-4">Acesso</h2>
              <Input label="Senha" type="password" required value={senha} onChange={e => setSenha(e.target.value)} error={errors.senha} placeholder="Senha de acesso" />
            </section>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>
            {isEdit ? 'Salvar alterações' : 'Cadastrar professor'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/professores')}>Cancelar</Button>
          {isEdit && (
            <Button type="button" variant="destructive" className="ml-auto" onClick={() => setInativarModal(true)}>
              Inativar professor
            </Button>
          )}
        </div>
      </form>

      <Modal open={inativarModal} onClose={() => setInativarModal(false)} title="Inativar professor?">
        <p className="text-sm text-[#5B5645] mb-6">
          Um professor inativo não poderá fazer login nem ser vinculado a novas turmas. Seus lançamentos anteriores permanecerão registrados.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setInativarModal(false)}>Cancelar</Button>
          <Button variant="destructive" loading={inativando} onClick={handleInativar}>Inativar professor</Button>
        </div>
      </Modal>
    </div>
  );
}
