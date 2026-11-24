import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { Erro } from '../../components/ui/Estado';
import { ResumoStrip, Saudacao } from '../../components/dashboard/ResumoStrip';

export function DashboardAluno({ nome }: { nome: string }) {
  const { data, loading, error, recarregar } = useApi(() => api.getMeuBoletim());

  const boletim = data ?? [];
  const contar = (situacao: string) => boletim.filter(item => item.situacao === situacao).length;
  const valor = (n: number) => (loading ? '—' : n);

  return (
    <div>
      <Saudacao titulo={`Olá, ${nome}`} subtitulo="Acompanhe seu desempenho acadêmico." />

      {error && <Erro texto={error} onTentarNovamente={recarregar} />}

      <ResumoStrip
        items={[
          { label: 'Disciplinas', value: valor(boletim.length) },
          { label: 'Aprovado', value: valor(contar('APROVADO')) },
          { label: 'Em andamento', value: valor(contar('EM_ANDAMENTO')) },
          { label: 'Recuperação', value: valor(contar('RECUPERACAO')) },
          { label: 'Reprovado', value: valor(contar('REPROVADO')) },
        ]}
      />

      <Link to="/boletim" className="text-sm font-bold text-[#3A2E00] hover:underline">
        Ver meu boletim →
      </Link>
    </div>
  );
}
