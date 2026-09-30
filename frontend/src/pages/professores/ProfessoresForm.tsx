import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../services/api';
import { formatarTelefone } from '../../utils/telefone';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

export function ProfessoresForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Edição e inativação de professor fazem parte da Sprint 2 (backlog #12).
  if (id) {
    return (
      <div className="max-w-4xl">
        <PageHeader
          title="Editar professor"
          backTo="/professores"
          breadcrumbs={[{ label: 'Professores', href: '/professores' }, { label: 'Editar' }]}
        />
        <div className="card-surface p-8 text-sm text-[#5B5645]">
          A edição e a inativação de professores ainda não estão disponíveis.
          <div className="mt-4">
            <Button variant="secondary" onClick={() => navigate('/professores')}>Voltar para a lista</Button>
          </div>
        </div>
      </div>
    );
  }

  const clearError = (campo: string) => setErrors(prev => ({ ...prev, [campo]: '' }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Nome completo é obrigatório.';
    if (!email.trim()) e.email = 'E-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Informe um e-mail válido.';
    if (!senha) e.senha = 'Senha é obrigatória no cadastro.';
    else if (senha.length < 6) e.senha = 'A senha deve ter no mínimo 6 caracteres.';
    if (senha && senha !== confirmarSenha) e.confirmarSenha = 'As senhas não conferem.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.createProfessor({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        contato: telefone.replace(/\D/g, ''), // salva só os dígitos
      });
      toast('Professor cadastrado com sucesso.');
      navigate('/professores');
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: 'E-mail já cadastrado no sistema.' });
      } else if (err instanceof ApiError && err.status === 403) {
        toast('Somente a Coordenação pode cadastrar professores.', 'error');
      } else if (err instanceof ApiError && err.data?.fields) {
        setErrors(err.data.fields);
      } else {
        toast(err?.message || 'Erro ao cadastrar professor.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Novo professor"
        backTo="/professores"
        breadcrumbs={[{ label: 'Professores', href: '/professores' }, { label: 'Novo' }]}
      />

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
          <section className="card-surface p-6">
            <h2 className="text-sm font-bold text-[#211C10] mb-4">Dados do professor</h2>
            <div className="grid gap-4">
              <Input
                label="Nome completo"
                required
                value={nome}
                onChange={e => { setNome(e.target.value); clearError('nome'); }}
                error={errors.nome}
                placeholder="Nome completo do professor"
              />
              <Input
                label="E-mail"
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); clearError('email'); }}
                error={errors.email}
                placeholder="email@exemplo.com"
              />
              <Input
                label="Telefone"
                value={telefone}
                onChange={e => setTelefone(formatarTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
          </section>

          <section className="card-surface p-6">
            <h2 className="text-sm font-bold text-[#211C10] mb-4">Acesso</h2>
            <div className="grid gap-4">
              <Input
                label="Senha"
                type="password"
                required
                autoComplete="new-password"
                value={senha}
                onChange={e => { setSenha(e.target.value); clearError('senha'); }}
                error={errors.senha}
                placeholder="Senha de acesso"
                hint="Mínimo de 6 caracteres."
              />
              <Input
                label="Confirmar senha"
                type="password"
                required
                autoComplete="new-password"
                value={confirmarSenha}
                onChange={e => { setConfirmarSenha(e.target.value); clearError('confirmarSenha'); }}
                error={errors.confirmarSenha}
                placeholder="Repita a senha"
              />
            </div>
          </section>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>Cadastrar professor</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/professores')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}