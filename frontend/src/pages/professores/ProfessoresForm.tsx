import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../services/api';
import { formatarTelefone } from '../../utils/telefone';
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

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [situacao, setSituacao] = useState('ATIVO');
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inativarModal, setInativarModal] = useState(false);
  const [inativando, setInativando] = useState(false);
  const [reativando, setReativando] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const prof = await api.getProfessor(id);
        if (cancelled) return;
        setNome(prof.nome);
        setEmail(prof.email);
        setTelefone(formatarTelefone(prof.contato || ''));
        setSituacao(prof.situacao);
      } catch (err: any) {
        if (!cancelled) setLoadError(err?.message || 'Não foi possível carregar o professor.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const clearError = (campo: string) => setErrors(prev => ({ ...prev, [campo]: '' }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Nome completo é obrigatório.';
    if (!email.trim()) e.email = 'E-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Informe um e-mail válido.';

    if (!isEdit && !senha) e.senha = 'Senha é obrigatória no cadastro.';
    else if (senha && senha.length < 6) e.senha = 'A senha deve ter no mínimo 6 caracteres.';
    if (senha && senha !== confirmarSenha) e.confirmarSenha = 'As senhas não conferem.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const contato = telefone.replace(/\D/g, ''); // salva só os dígitos

      if (!isEdit) {
        await api.createProfessor({ nome: nome.trim(), email: email.trim(), senha, contato });
        toast('Professor cadastrado com sucesso.');
      } else if (id) {
        const payload: { nome: string; email: string; contato: string; senha?: string } = {
          nome: nome.trim(),
          email: email.trim(),
          contato,
        };
        if (senha) payload.senha = senha; // só envia se foi digitada
        await api.updateProfessor(id, payload);
        toast('Professor atualizado com sucesso.');
      }
      navigate('/professores');
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: 'E-mail já cadastrado no sistema.' });
      } else if (err instanceof ApiError && err.status === 403) {
        toast('Somente a Coordenação pode gerenciar professores.', 'error');
      } else if (err instanceof ApiError && err.data?.fields) {
        setErrors(err.data.fields);
      } else {
        toast(err?.message || 'Erro ao salvar professor.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInativar = async () => {
    if (!id) return;
    setInativando(true);
    try {
      await api.inativarProfessor(id);
      setInativarModal(false);
      toast('Professor inativado com sucesso.');
      navigate('/professores');
    } catch (err: any) {
      toast(err?.message || 'Erro ao inativar professor.', 'error');
    } finally {
      setInativando(false);
    }
  };

  const handleReativar = async () => {
    if (!id) return;
    setReativando(true);
    try {
      await api.reativarProfessor(id);
      setSituacao('ATIVO');
      toast('Professor reativado com sucesso.');
    } catch (err: any) {
      toast(err?.message || 'Erro ao reativar professor.', 'error');
    } finally {
      setReativando(false);
    }
  };

  if (loading) {
    return (
      <div className="card-surface p-12 text-center text-[#5B5645]">
        Carregando dados do professor...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl">
        <PageHeader
          title="Editar professor"
          backTo="/professores"
          breadcrumbs={[{ label: 'Professores', href: '/professores' }, { label: 'Editar' }]}
        />
        <div className="card-surface p-8 text-sm text-[#5B5645]">
          <p className="mb-4">{loadError}</p>
          <Button variant="secondary" onClick={() => navigate('/professores')}>Voltar para a lista</Button>
        </div>
      </div>
    );
  }

  const inativo = situacao !== 'ATIVO';

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={isEdit ? 'Editar professor' : 'Novo professor'}
        backTo="/professores"
        breadcrumbs={[{ label: 'Professores', href: '/professores' }, { label: isEdit ? 'Editar' : 'Novo' }]}
      />

      {isEdit && inativo && (
        <div className="mb-6 px-4 py-3 rounded-[8px] bg-[#F3F4F6] border border-[#D2CFC7] text-sm text-[#5B5645]">
          Este professor está inativo: não faz login nem pode ser vinculado a novas turmas.
        </div>
      )}

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
                label={isEdit ? 'Nova senha' : 'Senha'}
                type="password"
                required={!isEdit}
                autoComplete="new-password"
                value={senha}
                onChange={e => { setSenha(e.target.value); clearError('senha'); }}
                error={errors.senha}
                placeholder={isEdit ? 'Deixe em branco para manter a atual' : 'Senha de acesso'}
                hint="Mínimo de 6 caracteres."
              />
              {(senha || !isEdit) && (
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
              )}
            </div>
          </section>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>
            {isEdit ? 'Salvar alterações' : 'Cadastrar professor'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/professores')}>
            Cancelar
          </Button>
          {isEdit && !inativo && (
            <Button
              type="button"
              variant="destructive"
              className="ml-auto"
              onClick={() => setInativarModal(true)}
            >
              Inativar professor
            </Button>
          )}
          {isEdit && inativo && (
            <Button type="button" className="ml-auto" loading={reativando} onClick={handleReativar}>
              Reativar professor
            </Button>
          )}
        </div>
      </form>

      <Modal open={inativarModal} onClose={() => setInativarModal(false)} title="Inativar professor?">
        <p className="text-sm text-[#5B5645] mb-6">
          O professor <strong>{nome}</strong> não poderá fazer login nem ser vinculado a novas turmas. Seus lançamentos anteriores permanecerão registrados.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setInativarModal(false)}>Cancelar</Button>
          <Button variant="destructive" loading={inativando} onClick={handleInativar}>
            Inativar professor
          </Button>
        </div>
      </Modal>
    </div>
  );
}