import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Professor } from '../../types';
import { api } from '../../services/api';
import { formatarTelefone } from '../../utils/telefone';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Ficha, FichaIcons, FichaWatermarks } from '../../components/ui/Ficha';

export function ProfessoresList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [situacao, setSituacao] = useState('');
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarProfessores = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProfessores();
      setProfessores(
        data.map(item => ({
          id: String(item.id),
          nome: item.nome,
          email: item.email,
          telefone: formatarTelefone(item.contato || ''),
          situacao: (item.situacao.toLowerCase() === 'ativo' ? 'ativo' : 'inativo') as 'ativo' | 'inativo',
        }))
      );
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar os professores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarProfessores();
  }, []);

  const filtered = professores.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchSituacao = !situacao || p.situacao === situacao;
    return matchSearch && matchSituacao;
  });

  const temFiltro = !!search || !!situacao;

  return (
    <div>
      <PageHeader
        title="Professores"
        description="Gerencie os professores cadastrados no sistema."
        action={<Button onClick={() => navigate('/professores/novo')}>+ Novo professor</Button>}
      />

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
          {filtered.length} professor{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between gap-4">
          <span>{error}</span>
          <button onClick={carregarProfessores} className="font-semibold underline cursor-pointer shrink-0">
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm font-semibold">Carregando professores...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C] gap-3">
          <p className="text-sm">
            {temFiltro ? 'Nenhum professor encontrado para este filtro.' : 'Nenhum professor cadastrado.'}
          </p>
          {!temFiltro && !error && (
            <Button size="sm" onClick={() => navigate('/professores/novo')}>Cadastrar o primeiro professor</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(p => (
            <Ficha
              key={p.id}
              eyebrow="Professor"
              title={p.nome}
              muted={p.situacao === 'inativo'}
              watermark={FichaWatermarks.formatura}
              status={{ label: p.situacao === 'ativo' ? 'Ativo' : 'Inativo', tone: p.situacao === 'ativo' ? 'ok' : 'off' }}
              stats={[
                { icon: FichaIcons.email, label: p.email },
                { icon: FichaIcons.telefone, label: p.telefone || 'Não informado' },
              ]}
            />
          ))}
        </div>
      )}
    </div>
  );
}