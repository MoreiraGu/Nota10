import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockProfessores } from '../../data/mockData';
import type { Professor } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Ficha, FichaIcons, FichaWatermarks } from '../../components/ui/Ficha';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export function ProfessoresList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [situacao, setSituacao] = useState('');
  const [professores, setProfessores] = useState<Professor[]>(mockProfessores);
  const [inativarModal, setInativarModal] = useState<Professor | null>(null);
  const [inativando, setInativando] = useState(false);

  const filtered = professores.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchSituacao = !situacao || p.situacao === situacao;
    return matchSearch && matchSituacao;
  });

  const handleInativar = async () => {
    if (!inativarModal) return;
    setInativando(true);
    await new Promise(r => setTimeout(r, 1000));
    setProfessores(prev => prev.map(p => p.id === inativarModal.id ? { ...p, situacao: 'inativo' } : p));
    setInativarModal(null);
    setInativando(false);
    toast('Professor inativado com sucesso.');
  };

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
            className="w-full pl-10 pr-4 py-2.5 text-sm border-[1.5px] border-[#D2CFC7] rounded-full bg-white hover:border-[#E6A700]"
          />
        </div>
        <select
          value={situacao}
          onChange={e => setSituacao(e.target.value)}
          className="px-4 py-2.5 text-sm border-[1.5px] border-[#D2CFC7] rounded-full bg-white cursor-pointer"
        >
          <option value="">Todas as situações</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
        <span className="text-xs font-semibold text-[#948F7C] ml-auto">
          {filtered.length} professor{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface-plain flex flex-col items-center justify-center py-16 text-[#948F7C]">
          <p className="text-sm">{search ? 'Nenhum professor encontrado.' : 'Nenhum professor cadastrado.'}</p>
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
              actions={
                <>
                  <button onClick={() => navigate(`/professores/${p.id}`)} className="text-xs font-bold hover:underline cursor-pointer" style={{ color: p.situacao === 'inativo' ? '#8A6D00' : '#3A2E00' }}>
                    Editar
                  </button>
                  {p.situacao === 'ativo' && (
                    <button onClick={() => setInativarModal(p)} className="text-xs font-semibold text-red-700 hover:underline cursor-pointer ml-auto">
                      Inativar
                    </button>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}

      <Modal open={!!inativarModal} onClose={() => setInativarModal(null)} title="Inativar professor?">
        <p className="text-sm text-[#5B5645] mb-6">
          Um professor inativo não poderá fazer login nem ser vinculado a novas turmas. Seus lançamentos anteriores permanecerão registrados.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setInativarModal(null)}>Cancelar</Button>
          <Button variant="destructive" loading={inativando} onClick={handleInativar}>Inativar professor</Button>
        </div>
      </Modal>
    </div>
  );
}
