import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../services/api';
import { formatarTelefone } from '../../utils/telefone';
import { apenasDigitos, pessoaVazia, validarPessoa } from '../../utils/validacao';
import type { DadosPessoa } from '../../utils/validacao';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Carregando } from '../../components/ui/Estado';
import { useToast } from '../../components/ui/Toast';
import { CamposPessoa, CamposSenha } from '../../components/forms/CamposPessoa';
import { BotaoSituacao } from '../../components/forms/BotaoSituacao';

export function ProfessoresForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const editando = !!id;

  const [dados, setDados] = useState<DadosPessoa>(pessoaVazia);
  const [situacao, setSituacao] = useState('ATIVO');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(editando);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getProfessor(id)
      .then(prof => {
        setDados({ ...pessoaVazia, nome: prof.nome, email: prof.email, telefone: formatarTelefone(prof.contato || '') });
        setSituacao(prof.situacao);
      })
      .catch(err => toast(err?.message || 'Não foi possível carregar o professor.', 'error'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const alterar = (campo: keyof DadosPessoa, valor: string) => {
    setDados(prev => ({ ...prev, [campo]: valor }));
    setErros(prev => ({ ...prev, [campo]: '' }));
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const novosErros = validarPessoa(dados, editando);
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    const payload = {
      nome: dados.nome.trim(),
      email: dados.email.trim(),
      contato: apenasDigitos(dados.telefone),
      ...(dados.senha ? { senha: dados.senha } : {}),
    };

    setSaving(true);
    try {
      if (id) await api.updateProfessor(id, payload);
      else await api.createProfessor({ ...payload, senha: dados.senha });
      toast(editando ? 'Professor atualizado com sucesso.' : 'Professor cadastrado com sucesso.');
      navigate('/professores');
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) setErros({ email: 'E-mail já cadastrado no sistema.' });
      else toast(err?.message || 'Erro ao salvar professor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inativar = async () => {
    try {
      await api.inativarProfessor(id!);
      toast('Professor inativado com sucesso.');
      navigate('/professores');
    } catch (err: any) {
      toast(err?.message || 'Erro ao inativar professor.', 'error');
    }
  };

  const reativar = async () => {
    try {
      await api.reativarProfessor(id!);
      setSituacao('ATIVO');
      toast('Professor reativado com sucesso.');
    } catch (err: any) {
      toast(err?.message || 'Erro ao reativar professor.', 'error');
    }
  };

  if (loading) return <Carregando texto="Carregando dados do professor..." />;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={editando ? 'Editar professor' : 'Novo professor'}
        backTo="/professores"
        breadcrumbs={[{ label: 'Professores', href: '/professores' }, { label: editando ? 'Editar' : 'Novo' }]}
      />

      <form onSubmit={handleSalvar}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
          <CamposPessoa dados={dados} erros={erros} editando={editando} onChange={alterar} />
          <CamposSenha dados={dados} erros={erros} editando={editando} onChange={alterar} />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>{editando ? 'Salvar alterações' : 'Cadastrar professor'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/professores')}>Cancelar</Button>
          {editando && (
            <BotaoSituacao
              ativo={situacao === 'ATIVO'}
              tipo="professor"
              nome={dados.nome}
              onInativar={inativar}
              onReativar={reativar}
            />
          )}
        </div>
      </form>
    </div>
  );
}
