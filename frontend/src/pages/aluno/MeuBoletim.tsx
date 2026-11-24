import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { PageHeader } from '../../components/ui/PageHeader';
import { Carregando, Erro, Vazio } from '../../components/ui/Estado';
import { BoletimCard } from '../../components/boletim/BoletimCard';

export function MeuBoletim() {
  const { data: boletim, loading, error, recarregar } = useApi(() => api.getMeuBoletim());

  return (
    <div>
      <PageHeader
        title="Meu Boletim"
        description="Acompanhe suas notas, médias, frequência e situação em cada disciplina."
      />

      {error && <Erro texto={error} onTentarNovamente={recarregar} />}

      {loading ? (
        <Carregando texto="Carregando boletim..." />
      ) : !boletim || boletim.length === 0 ? (
        <Vazio texto="Nenhuma turma matriculada encontrada." />
      ) : (
        <div className="space-y-4">
          {boletim.map(item => (
            <BoletimCard key={item.turmaId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
