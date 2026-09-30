import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Estudante } from '../../types';
import { api } from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Ficha, FichaIcons, FichaWatermarks } from '../../components/ui/Ficha';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export function EstudantesList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [situacao, setSituacao] = useState('');
  const [estudantes, setEstudantes] = useState<Estudante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inativarModal, setInativarModal] = useState<Estudante | null>(null);
  const [inativando, setInativando] = useState(false);

  const carregarEstudantes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEstudantes();
      const mapped: Estudante[] = data.map(item => ({
        id: String(item.id),
        nome: item.nome,
        email: item.email,
        telefone: '',
        curso: item.curso || `Curso #${item.curso_id}`,
        cursoId: String(item.curso_id),
        situacao: (item.situacao.toLowerCase() === 'ativo' ? 'ativo' : 'inativo') as 'ativo' | 'inativo',
      }));
      setEstudantes(mapped);
    } catch (err: any) {
      setError(err?.message || 'Falha ao conectar com o backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEstudantes();
  }, []);

  const filtered = estudantes.filter(e => {
    const matchSearch = e.nome.toLowerCase().includes(search.toLowerCase());
    const matchSituacao = !situacao || e.situacao === situacao;
    return matchSearch && matchSituacao;
  });

  const handleInativar = async () => {
    if (!inativarModal) return;
    setInativando(true);
    try {
      await api.inativarEstudante(inativarModal.id);
      setEstudantes(prev =>
        prev.map(e => (e.id === inativarModal.id ? { ...e, situacao: 'inativo' } : e))
      );
      setInativarModal(null);
      toast('Estudante inativado com sucesso.');
    } catch (err: any) {
      toast(err?.message || 'Erro ao inativar estudante.');
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

      {/* Filtros em formato de pílula */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#948F7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border-[1.5px] border-[#D2CFC7] rounded-full bg-white hover:border-[#E6A700] focus:border-[#E6A700] transition-colors"
          />
        </div>
        <select
          value={situacao}
          onChange={e => setSituacao(e.target.value)}
          className="px-4 py-2.5 text-sm border-[1.5px] border-[#D2CFC7] rounded-full bg-white hover:border-[#E6A700] cursor-pointer"
        >
          <option value="">Todas as situações</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
        <span className="text-xs font-semibold text-[#948F7C] ml-auto">
          {filtered.length} estudante{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm font-semibold">Carregando estudantes do banco de dados...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm">{search ? 'Nenhum estudante encontrado para esta busca.' : 'Nenhum estudante cadastrado.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(e => (
            <Ficha
              key={e.id}
              eyebrow="Estudante"
              title={e.nome}
              muted={e.situacao === 'inativo'}
              watermark={FichaWatermarks.pessoa}
              status={{ label: e.situacao === 'ativo' ? 'Ativo' : 'Inativo', tone: e.situacao === 'ativo' ? 'ok' : 'off' }}
              stats={[
                { icon: FichaIcons.email, label: e.email },
                { icon: FichaIcons.curso, label: e.curso },
              ]}
              actions={
                <>
                  <button onClick={() => navigate(`/estudantes/${e.id}`)} className="text-xs font-bold hover:underline cursor-pointer" style={{ color: e.situacao === 'inativo' ? '#8A6D00' : '#3A2E00' }}>
                    Editar
                  </button>
                  <button className="text-xs font-semibold hover:underline cursor-pointer" style={{ color: e.situacao === 'inativo' ? '#5B5645' : '#5B4A00' }}>
                    Boletim
                  </button>
                  <button className="text-xs font-semibold hover:underline cursor-pointer" style={{ color: e.situacao === 'inativo' ? '#5B5645' : '#5B4A00' }}>
                    Histórico
                  </button>
                  {e.situacao === 'ativo' && (
                    <button onClick={() => setInativarModal(e)} className="text-xs font-semibold text-red-700 hover:underline cursor-pointer ml-auto">
                      Inativar
                    </button>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}

      {/* Inativar modal */}
      <Modal open={!!inativarModal} onClose={() => setInativarModal(null)} title="Inativar estudante?">
        <p className="text-sm text-[#5B5645] mb-6">
          O estudante <strong>{inativarModal?.nome}</strong> não poderá fazer login nem ser matriculado em novas turmas, mas seus registros acadêmicos permanecerão disponíveis para consulta.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setInativarModal(null)}>Cancelar</Button>
          <Button variant="destructive" loading={inativando} onClick={handleInativar}>Inativar estudante</Button>
        </div>
      </Modal>
    </div>
  );
}
