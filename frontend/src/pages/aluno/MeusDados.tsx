import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { Carregando, Erro, Vazio } from '../../components/ui/Estado';

export function MeusDados() {
  const { user } = useAuth();
  const { data: boletim, loading, error, recarregar } = useApi(() => api.getMeuBoletim());

  return (
    <div className="max-w-2xl">
      <PageHeader title="Meus Dados" description="Seus dados de acesso e as disciplinas em que está matriculado." />

      <section className="card-surface p-6 mb-6 grid gap-3 text-sm">
        <Linha titulo="Nome" valor={user?.nome} />
        <Linha titulo="E-mail" valor={user?.email || 'Não informado'} />
        <Linha titulo="Perfil" valor="Aluno" />
      </section>

      <h2 className="text-sm font-bold text-[#211C10] mb-3">Disciplinas matriculadas</h2>

      {error && <Erro texto={error} onTentarNovamente={recarregar} />}

      {loading ? (
        <Carregando />
      ) : !boletim || boletim.length === 0 ? (
        <Vazio texto="Você não está matriculado em nenhuma disciplina." />
      ) : (
        <ul className="card-surface-plain divide-y divide-[#F1E9C8] px-5">
          {boletim.map(item => (
            <li key={item.turmaId} className="flex justify-between py-3 text-sm">
              <span className="font-semibold text-[#211C10]">{item.disciplina}</span>
              <span className="text-[#948F7C]">{item.periodoLetivo}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Linha({ titulo, valor }: { titulo: string; valor?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#948F7C]">{titulo}</span>
      <span className="font-semibold text-[#211C10]">{valor}</span>
    </div>
  );
}
