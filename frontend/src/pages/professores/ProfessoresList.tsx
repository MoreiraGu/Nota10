import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { formatarTelefone } from '../../utils/telefone';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Ficha, FichaIcons, FichaWatermarks } from '../../components/ui/Ficha';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Carregando, Erro, Vazio } from '../../components/ui/Estado';
import { FiltroBusca } from '../../components/ui/FiltroBusca';

interface ProfessorSelecionado {
  id: number;
  nome: string;
}

export function ProfessoresList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, loading, error, recarregar } = useApi(() => api.getProfessores());

  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState('');
  const [paraInativar, setParaInativar] = useState<ProfessorSelecionado | null>(null);
  const [inativando, setInativando] = useState(false);

  const professores = (data ?? []).filter(p => {
    const bateNome = p.nome.toLowerCase().includes(busca.toLowerCase());
    const bateSituacao = !situacao || p.situacao.toLowerCase() === situacao;
    return bateNome && bateSituacao;
  });

  const handleInativar = async () => {
    if (!paraInativar) return;
    setInativando(true);
    try {
      await api.inativarProfessor(paraInativar.id);
      toast('Professor inativado com sucesso.');
      setParaInativar(null);
      recarregar();
    } catch (err: any) {
      toast(err?.message || 'Erro ao inativar professor.', 'error');
    } finally {
      setInativando(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Professores"
        description="Gerencie os professores cadastrados no sistema."
        action={<Button onClick={() => navigate('/professores/novo')}>+ Novo professor</Button>}
      />

      <FiltroBusca
        busca={busca}
        onBuscaChange={setBusca}
        situacao={situacao}
        onSituacaoChange={setSituacao}
        total={`${professores.length} professor(es) encontrado(s)`}
      />

      {error && <Erro texto={error} onTentarNovamente={recarregar} />}

      {loading ? (
        <Carregando texto="Carregando professores..." />
      ) : professores.length === 0 ? (
        <Vazio texto="Nenhum professor encontrado." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {professores.map(p => {
            const ativo = p.situacao.toLowerCase() === 'ativo';
            return (
              <Ficha
                key={p.id}
                eyebrow="Professor"
                title={p.nome}
                muted={!ativo}
                watermark={FichaWatermarks.formatura}
                status={{ label: ativo ? 'Ativo' : 'Inativo', tone: ativo ? 'ok' : 'off' }}
                stats={[
                  { icon: FichaIcons.email, label: p.email },
                  { icon: FichaIcons.telefone, label: formatarTelefone(p.contato || '') || 'Não informado' },
                ]}
                actions={
                  <>
                    <button
                      onClick={() => navigate(`/professores/${p.id}`)}
                      className="text-xs font-bold hover:underline cursor-pointer text-[#3A2E00]"
                    >
                      Editar
                    </button>
                    {ativo && (
                      <button
                        onClick={() => setParaInativar({ id: p.id, nome: p.nome })}
                        className="text-xs font-semibold text-red-700 hover:underline cursor-pointer ml-auto"
                      >
                        Inativar
                      </button>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}

      <Modal open={!!paraInativar} onClose={() => setParaInativar(null)} title="Inativar professor?">
        <p className="text-sm text-[#5B5645] mb-6">
          O professor <strong>{paraInativar?.nome}</strong> não poderá fazer login nem ser vinculado a novas turmas. Seus lançamentos anteriores continuam registrados.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setParaInativar(null)}>Cancelar</Button>
          <Button variant="destructive" loading={inativando} onClick={handleInativar}>Inativar professor</Button>
        </div>
      </Modal>
    </div>
  );
}
