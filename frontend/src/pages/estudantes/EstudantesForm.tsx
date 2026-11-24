import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { formatarTelefone } from '../../utils/telefone';
import { apenasDigitos, pessoaVazia, validarPessoa } from '../../utils/validacao';
import type { DadosPessoa } from '../../utils/validacao';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Carregando } from '../../components/ui/Estado';
import { useToast } from '../../components/ui/Toast';
import { CamposPessoa, CamposSenha } from '../../components/forms/CamposPessoa';
import { BotaoSituacao } from '../../components/forms/BotaoSituacao';

export function EstudantesForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const editando = !!id;

  const cursos = useApi(() => api.getCursos());

  const [dados, setDados] = useState<DadosPessoa>(pessoaVazia);
  const [cursoId, setCursoId] = useState('');
  const [situacao, setSituacao] = useState('ATIVO');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(editando);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getEstudante(id)
      .then(est => {
        setDados({ ...pessoaVazia, nome: est.nome, email: est.email, telefone: formatarTelefone(est.contato || '') });
        setCursoId(String(est.curso_id));
        setSituacao(est.situacao);
      })
      .catch(err => toast(err?.message || 'Não foi possível carregar o estudante.', 'error'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const alterar = (campo: keyof DadosPessoa, valor: string) => {
    setDados(prev => ({ ...prev, [campo]: valor }));
    setErros(prev => ({ ...prev, [campo]: '' }));
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const novosErros = validarPessoa(dados, editando);
    if (!cursoId) novosErros.cursoId = 'Selecione um curso.';
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    const payload = {
      nome: dados.nome.trim(),
      email: dados.email.trim(),
      contato: apenasDigitos(dados.telefone),
      curso_id: Number(cursoId),
      ...(dados.senha ? { senha: dados.senha } : {}),
    };

    setSaving(true);
    try {
      if (id) await api.updateEstudante(id, payload);
      else await api.createEstudante({ ...payload, senha: dados.senha });
      toast(editando ? 'Estudante atualizado com sucesso.' : 'Estudante cadastrado com sucesso.');
      navigate('/estudantes');
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) setErros({ email: 'E-mail já cadastrado no sistema.' });
      else toast(err?.message || 'Erro ao salvar estudante.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inativar = async () => {
    try {
      await api.inativarEstudante(id!);
      toast('Estudante inativado com sucesso.');
      navigate('/estudantes');
    } catch (err: any) {
      toast(err?.message || 'Erro ao inativar estudante.', 'error');
    }
  };

  const reativar = async () => {
    try {
      await api.reativarEstudante(id!);
      setSituacao('ATIVO');
      toast('Estudante reativado com sucesso.');
    } catch (err: any) {
      toast(err?.message || 'Erro ao reativar estudante.', 'error');
    }
  };

  if (loading || cursos.loading) return <Carregando texto="Carregando dados do estudante..." />;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={editando ? 'Editar estudante' : 'Novo estudante'}
        backTo="/estudantes"
        breadcrumbs={[{ label: 'Estudantes', href: '/estudantes' }, { label: editando ? 'Editar' : 'Novo' }]}
      />

      <form onSubmit={handleSalvar}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
          <CamposPessoa dados={dados} erros={erros} editando={editando} onChange={alterar} />

          <div className="flex flex-col gap-6">
            <section className="card-surface p-6">
              <h2 className="text-sm font-bold text-[#211C10] mb-4">Dados acadêmicos</h2>
              <Select label="Curso" required value={cursoId} onChange={e => setCursoId(e.target.value)} error={erros.cursoId}>
                <option value="">Selecione um curso</option>
                {(cursos.data ?? []).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </section>

            <CamposSenha dados={dados} erros={erros} editando={editando} onChange={alterar} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>{editando ? 'Salvar alterações' : 'Cadastrar estudante'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/estudantes')}>Cancelar</Button>
          {editando && (
            <BotaoSituacao
              ativo={situacao === 'ATIVO'}
              tipo="estudante"
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
