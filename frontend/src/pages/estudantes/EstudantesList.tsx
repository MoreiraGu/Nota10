import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Ficha, FichaIcons, FichaWatermarks } from '../../components/ui/Ficha';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Carregando, Erro, Vazio } from '../../components/ui/Estado';
import { FiltroBusca } from '../../components/ui/FiltroBusca';

interface EstudanteSelecionado {
  id: number;
  nome: string;
}

export function EstudantesList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, loading, error, recarregar } = useApi(() => api.getEstudantes());

  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState('');
  const [paraInativar, setParaInativar] = useState<EstudanteSelecionado | null>(null);
  const [inativando, setInativando] = useState(false);

  const estudantes = (data ?? []).filter(e => {
    const bateNome = e.nome.toLowerCase().includes(busca.toLowerCase());
    const bateSituacao = !situacao || e.situacao.toLowerCase() === situacao;
    return bateNome && bateSituacao;
  });

  const handleInativar = async () => {
    if (!paraInativar) return;
    setInativando(true);
    try {
      await api.inativarEstudante(paraInativar.id);
      toast('Estudante inativado com sucesso.');
      setParaInativar(null);
      recarregar();
    } catch (err: any) {
      toast(err?.message || 'Erro ao inativar estudante.', 'error');
    } finally {
      setInativando(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Estudantes"
        description="Gerencie os estudantes cadastrados no sistema."
        action={<Button onClick={() => navigate('/estudantes/novo')}>+ Novo estudante</Button>}
      />

      <FiltroBusca
        busca={busca}
        onBuscaChange={setBusca}
        situacao={situacao}
        onSituacaoChange={setSituacao}
        total={`${estudantes.length} estudante(s) encontrado(s)`}
      />

      {error && <Erro texto={error} onTentarNovamente={recarregar} />}

      {loading ? (
        <Carregando texto="Carregando estudantes..." />
      ) : estudantes.length === 0 ? (
        <Vazio texto="Nenhum estudante encontrado." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {estudantes.map(e => {
            const ativo = e.situacao.toLowerCase() === 'ativo';
            return (
              <Ficha
                key={e.id}
                eyebrow="Estudante"
                title={e.nome}
                muted={!ativo}
                watermark={FichaWatermarks.pessoa}
                status={{ label: ativo ? 'Ativo' : 'Inativo', tone: ativo ? 'ok' : 'off' }}
                stats={[
                  { icon: FichaIcons.email, label: e.email },
                  { icon: FichaIcons.curso, label: e.curso || `Curso #${e.curso_id}` },
                ]}
                actions={
                  <>
                    <button
                      onClick={() => navigate(`/estudantes/${e.id}`)}
                      className="text-xs font-bold hover:underline cursor-pointer text-[#3A2E00]"
                    >
                      Editar
                    </button>
                    {ativo && (
                      <button
                        onClick={() => setParaInativar({ id: e.id, nome: e.nome })}
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

      <Modal open={!!paraInativar} onClose={() => setParaInativar(null)} title="Inativar estudante?">
        <p className="text-sm text-[#5B5645] mb-6">
          O estudante <strong>{paraInativar?.nome}</strong> não poderá fazer login nem ser matriculado em novas turmas, mas seus registros acadêmicos continuam disponíveis.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setParaInativar(null)}>Cancelar</Button>
          <Button variant="destructive" loading={inativando} onClick={handleInativar}>Inativar estudante</Button>
        </div>
      </Modal>
    </div>
  );
}
