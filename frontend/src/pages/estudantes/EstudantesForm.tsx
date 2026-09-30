import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

function formatarTelefone(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function EstudantesForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const [cursos, setCursos] = useState<Array<{ id: number; nome: string }>>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [situacao, setSituacao] = useState('ATIVO');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inativarModal, setInativarModal] = useState(false);
  const [inativando, setInativando] = useState(false);
  const [reativando, setReativando] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const cursosData = await api.getCursos();
        setCursos(cursosData);

        if (isEdit && id) {
          const est = await api.getEstudante(id);
          setNome(est.nome);
          setEmail(est.email);
          setTelefone(formatarTelefone(est.contato || ''));
          setCursoId(String(est.curso_id));
          setSituacao(est.situacao);
        } else if (cursosData.length > 0 && !cursoId) {
          setCursoId(String(cursosData[0].id));
        }
      } catch (err: any) {
        toast(err?.message || 'Falha ao carregar dados do estudante.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, isEdit]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Nome completo é obrigatório.';
    if (!email.trim()) e.email = 'E-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Informe um e-mail válido.';
    if (!cursoId) e.cursoId = 'Selecione um curso.';

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
    setErrors({});
    try {
      // salva só os dígitos do telefone
      const contato = telefone.replace(/\D/g, '');

      if (!isEdit) {
        await api.createEstudante({
          nome: nome.trim(),
          email: email.trim(),
          senha,
          contato,
          curso_id: Number(cursoId),
        });
        toast('Estudante cadastrado com sucesso.');
        navigate('/estudantes');
      } else if (id) {
        const payload: {
          nome: string;
          email: string;
          contato: string;
          curso_id: number;
          senha?: string;
        } = {
          nome: nome.trim(),
          email: email.trim(),
          contato,
          curso_id: Number(cursoId),
        };
        if (senha) payload.senha = senha; // só envia se o usuário digitou

        await api.updateEstudante(id, payload);
        toast('Estudante atualizado com sucesso.');
        navigate('/estudantes');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: 'E-mail já cadastrado no sistema.' });
      } else if (err instanceof ApiError && err.data?.fields) {
        setErrors(err.data.fields);
      } else {
        toast(err?.message || 'Erro ao salvar estudante.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInativar = async () => {
    if (!id) return;
    setInativando(true);
    try {
      await api.inativarEstudante(id);
      setInativando(false);
      setInativarModal(false);
      toast('Estudante inativado com sucesso.');
      navigate('/estudantes');
    } catch (err: any) {
      toast(err?.message || 'Erro ao inativar estudante.');
      setInativando(false);
    }
  };


  const handleReativar = async () => {
  if (!id) return;
  setReativando(true);
  try {
    await api.reativarEstudante(id);
    setSituacao('ATIVO');
    toast('Estudante reativado com sucesso.');
  } catch (err: any) {
    toast(err?.message || 'Erro ao reativar estudante.');
  } finally {
    setReativando(false);
  }
};

  if (loading) {
    return (
      <div className="card-surface p-12 text-center text-[#5B5645]">
        Carregando dados do estudante...
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={isEdit ? 'Editar estudante' : 'Novo estudante'}
        backTo="/estudantes"
        breadcrumbs={[{ label: 'Estudantes', href: '/estudantes' }, { label: isEdit ? 'Editar' : 'Novo' }]}
      />

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
          <section className="card-surface p-6">
            <h2 className="text-sm font-bold text-[#211C10] mb-4">Dados pessoais</h2>
            <div className="grid gap-4">
              <Input
                label="Nome completo"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                error={errors.nome}
                placeholder="Nome completo do estudante"
              />
              <Input
                label="E-mail"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
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

          <div className="flex flex-col gap-6">
            <section className="card-surface p-6">
              <h2 className="text-sm font-bold text-[#211C10] mb-4">Dados acadêmicos</h2>
              <Select
                label="Curso"
                required
                value={cursoId}
                onChange={e => setCursoId(e.target.value)}
                error={errors.cursoId}
              >
                <option value="">Selecione um curso</option>
                {cursos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
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
                  onChange={e => setSenha(e.target.value)}
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
                    onChange={e => setConfirmarSenha(e.target.value)}
                    error={errors.confirmarSenha}
                    placeholder="Repita a senha"
                  />
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>
            {isEdit ? 'Salvar alterações' : 'Cadastrar estudante'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/estudantes')}>
            Cancelar
          </Button>
          {isEdit && situacao === 'ATIVO' && (
            <Button
              type="button"
              variant="destructive"
              className="ml-auto"
              onClick={() => setInativarModal(true)}
            >
              Inativar estudante
            </Button>
          )}
          {isEdit && situacao !== 'ATIVO' && (
            <Button
              type="button"
              className="ml-auto"
              loading={reativando}
              onClick={handleReativar}
            >
              Reativar estudante
            </Button>
          )}
        </div>
      </form>

      <Modal open={inativarModal} onClose={() => setInativarModal(false)} title="Inativar estudante?">
        <p className="text-sm text-[#5B5645] mb-6">
          O estudante <strong>{nome}</strong> não poderá fazer login nem ser matriculado em novas turmas, mas seus registros acadêmicos permanecerão disponíveis para consulta.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setInativarModal(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" loading={inativando} onClick={handleInativar}>
            Inativar estudante
          </Button>
        </div>
      </Modal>
    </div>
  );
}